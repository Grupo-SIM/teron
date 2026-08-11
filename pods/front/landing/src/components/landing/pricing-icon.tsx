"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Alignment,
  Fit,
  Layout,
  RuntimeLoader,
  useRive,
  useStateMachineInput,
} from "@rive-app/react-canvas";

import { useReadLine } from "./scroll-words";

/*
 * Ícone que nasce dentro da frase quando a leitura chega nele.
 *
 * Todos os ícones moram num arquivo Rive só, cada um num artboard próprio, com
 * a mesma máquina de estados (`SM`) e os gatilhos `intro` e `outro`. Entrar na
 * linha de leitura dispara `intro`; sair por cima dispara `outro` e devolve o
 * espaço ao texto.
 *
 * O espaço é devolvido pela margem direita: enquanto escondido ela vale menos a
 * largura inteira do ícone, então as palavras se fecham em volta dele. Animar a
 * margem (e não a largura) é o que faz o texto abrir empurrando as palavras
 * seguintes em vez de reflowar tudo de uma vez.
 */

// Mesmo motivo do `rive-anim`: bloqueador de tracker barra o CDN do runtime e o
// canvas fica vazio, então o wasm vem do nosso domínio.
RuntimeLoader.setWasmUrl("/rive/rive.wasm");
RuntimeLoader.setWasmFallbackUrl(null);

const SRC = "/animations/pricing-icons.riv";
const MACHINE = "SM";

/*
 * Todos os artboards vivem no mesmo arquivo de 1MB. Passar `src` a cada ícone
 * faria nove pedidos do mesmo binário, então ele é baixado uma vez e cada
 * canvas recebe o buffer já pronto.
 */
let filePromise: Promise<ArrayBuffer> | null = null;

function loadFile() {
  filePromise ??= fetch(SRC).then((response) => response.arrayBuffer());
  return filePromise;
}


type PricingIconProps = {
  /** Nome do artboard dentro de `pricing-icons.riv`. */
  artboard: string;
  width?: number;
  height?: number;
  marginLeft?: number;
  marginRight?: number;
  /** Sobe o canvas para o desenho cair na altura da linha de texto. */
  offsetTop?: number;
};

export function PricingIcon({
  artboard,
  width = 210,
  height = 210,
  marginLeft = -72,
  marginRight = -72,
  offsetTop = -85,
}: PricingIconProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const shown = useReadLine(hostRef);
  const [file, setFile] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    let live = true;
    loadFile().then((buffer) => {
      if (live) setFile(buffer);
    });

    return () => {
      live = false;
    };
  }, []);

  const { rive, RiveComponent } = useRive(
    file == null
      ? null
      : {
          buffer: file,
          artboard,
          stateMachines: MACHINE,
          autoplay: false,
          layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
        },
  );

  const intro = useStateMachineInput(rive, MACHINE, "intro");
  const outro = useStateMachineInput(rive, MACHINE, "outro");

  useEffect(() => {
    if (rive == null) return;

    if (shown) {
      rive.play(MACHINE);
      intro?.fire();
      return;
    }

    outro?.fire();
    // A saída tem os seus próprios quadros: pausar na hora cortaria a animação
    // pela metade num ícone que pode voltar à tela em seguida.
    const timer = setTimeout(() => rive.pause(MACHINE), 800);

    return () => clearTimeout(timer);
  }, [rive, shown, intro, outro]);

  /*
   * As medidas saem daqui como número puro, não como pixel: o CSS multiplica
   * todas elas pelo fator `--s` da faixa de tela antes de virar comprimento.
   * O ícone inteiro (caixa, recuos e altura da linha) encolhe junto, então a
   * arte continua caindo na altura do texto em qualquer largura — que é o que
   * um `transform: scale` não daria, porque ele não devolve espaço ao texto.
   */
  return (
    <span
      ref={hostRef}
      aria-hidden
      className="lp-pr-icon"
      data-shown={shown}
      style={
        {
          "--w": width,
          "--h": height,
          "--ml": marginLeft,
          "--mt": offsetTop,
          /*
           * Recolhido, a margem direita anula exatamente a largura e a margem
           * esquerda: o ícone passa a ocupar zero e some do meio da frase. O
           * que ele não pode é ocupar menos que zero — com um recuo extra ele
           * comeria o espaço entre as palavras vizinhas, e ao subir a página o
           * texto ficaria grudado.
           */
          "--mr": shown ? marginRight : -(width + marginLeft),
        } as CSSProperties
      }
    >
      <span className="lp-pr-icon-art">
        <RiveComponent />
      </span>
    </span>
  );
}
