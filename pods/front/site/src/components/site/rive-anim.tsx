"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alignment,
  Fit,
  Layout,
  RuntimeLoader,
  StateMachineInputType,
  useRive,
  type StateMachineInput,
} from "@rive-app/react-canvas";

// Por padrão o runtime busca o .wasm no unpkg, com fallback no jsdelivr.
// Qualquer bloqueador de anúncios/tracker barra os dois e o canvas fica vazio,
// então servimos o binário do nosso próprio domínio (copiado por `copy:rive`).
RuntimeLoader.setWasmUrl("/rive/rive.wasm");
RuntimeLoader.setWasmFallbackUrl(null);

type RiveAnimProps = {
  /** Caminho do `.riv` dentro de `public`, ex.: `/animations/hotkeys.riv`. */
  src: string;
  className?: string;
  /** `cover` preenche o container; `contain` mostra a arte inteira. */
  fit?: "cover" | "contain";
  /**
   * De 0 a 1: prende a animação ao scroll em vez de deixá-la em loop. O quadro
   * exibido passa a ser função do progresso, como no teron.io.
   */
  progress?: number;
  /**
   * Adota a proporção do artboard. Com `contain`, um container de proporção
   * diferente deixa barras em volta da arte, e qualquer coisa posicionada em %
   * sobre o canvas desalinha do desenho.
   */
  matchArtboard?: boolean;
};

/**
 * Canvas Rive. Sem `progress` roda em loop e só anima enquanto está na
 * viewport — cada `.riv` mantém um loop, e vários rodando fora de tela queimam
 * CPU à toa. Com `progress`, quem manda no tempo é o scroll.
 */
export function RiveAnim({
  src,
  className,
  fit = "cover",
  progress,
  matchArtboard = false,
}: RiveAnimProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const driveRef = useRef<StateMachineInput | null>(null);
  const trackRef = useRef<string | null>(null);
  const durationRef = useRef(0);
  const modeRef = useRef<"input" | "scrub" | "loop">("loop");
  const scrubbed = progress != null;
  /** Reaplica o progresso assim que a duração da timeline fica disponível. */
  const [ready, setReady] = useState(0);

  const { RiveComponent, rive } = useRive({
    src,
    autoplay: false,
    layout: new Layout({
      fit: fit === "cover" ? Fit.Cover : Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  // A proporção do artboard vira a da caixa, para que `contain` não deixe
  // barras e o que for posicionado em % sobre o canvas caia sobre o desenho.
  const { maxX = 0, maxY = 0 } = rive?.bounds ?? {};
  const ratio = matchArtboard && maxX > 0 && maxY > 0 ? `${maxX} / ${maxY}` : null;

  useEffect(() => {
    const host = hostRef.current;
    if (host == null || rive == null || scrubbed) return;

    // Os arquivos do teron.io usam state machine; alguns só têm timeline solta.
    const play = () => {
      const [machine] = rive.stateMachineNames;
      rive.play(machine ?? rive.animationNames[0]);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) play();
        else rive.pause();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(host);

    return () => io.disconnect();
  }, [rive, scrubbed]);

  /*
   * Modo scroll, parte 1: descobrir como este arquivo aceita ser controlado.
   * Só dá para saber depois de instanciar — `stateMachineInputs` devolve
   * `undefined` enquanto a máquina não estiver rodando, e `scrub` não age sobre
   * animação que nunca tocou. Fica fora do efeito de progresso porque isso
   * precisa acontecer uma vez, não a cada frame de scroll.
   */
  useEffect(() => {
    if (rive == null || !scrubbed) return;

    /*
     * O cards.riv traz "Idle Blink", "Blink", "1 to 2", "2 to 1", "intro" e
     * "intro 2". Quem faz o card virar é a transição "1 to 2" — as demais são
     * o cursor piscando e as entradas de cada card. Pegar a primeira da lista
     * varreria 0.1s de piscada e nada mudaria na tela.
     */
    const names = rive.animationNames ?? [];
    const timeline =
      names.find((name) => /^\s*\d+\s*to\s*\d+\s*$/.test(name)) ??
      names.find((name) => name.toLowerCase() === "main") ??
      names[0];

    if (timeline != null) {
      // Instanciada primeiro, e sozinha, para que `durations[0]` seja a dela.
      rive.play(timeline);
      rive.pause(timeline);
      trackRef.current = timeline;
      modeRef.current = "scrub";

      const frame = requestAnimationFrame(() => {
        // `durations` só existe depois que a animação é instanciada; no instante
        // do play ainda está vazio, e sem esta releitura o primeiro scrub usaria
        // duração 0 e prenderia a timeline no quadro inicial.
        durationRef.current = rive.durations?.[0] ?? 0;

        // O piscar do cursor é um loop à parte e continua rodando sozinho, por
        // cima da transição que o scroll controla.
        const idle = names.find((name) => /idle/i.test(name));
        if (idle != null) rive.play(idle);

        setReady((n) => n + 1);
      });

      return () => cancelAnimationFrame(frame);
    }

    const [machine] = rive.stateMachineNames;
    if (machine == null) return;

    rive.play(machine);

    const number = (rive.stateMachineInputs(machine) ?? []).find(
      (input) => input.type === StateMachineInputType.Number,
    );

    // Sem input numérico a máquina toca sozinha: melhor deixá-la em loop do
    // que travar num quadro, já que `scrub` não vale para state machine.
    driveRef.current = number ?? null;
    modeRef.current = number != null ? "input" : "loop";
  }, [rive, scrubbed]);

  // Parte 2: aplicar o progresso pelo caminho que o arquivo suporta.
  useEffect(() => {
    if (rive == null || progress == null) return;

    if (modeRef.current === "input" && driveRef.current != null) {
      driveRef.current.value = progress * 100;
      return;
    }

    const timeline = trackRef.current;
    if (modeRef.current !== "scrub" || timeline == null) return;

    // Duração guardada na instanciação: `durations` acompanha as animações
    // instanciadas, não as do artboard, e o índice muda assim que o loop do
    // cursor entra junto.
    const duration = durationRef.current;
    if (duration > 0) rive.scrub(timeline, progress * duration);
  }, [rive, progress, ready]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={ratio != null ? { aspectRatio: ratio } : undefined}
    >
      <RiveComponent className="lp-rive-canvas" />
    </div>
  );
}
