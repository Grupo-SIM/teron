"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { RiveAnim } from "./rive-anim";

type Author = "blue" | "orange";

const AUTHORS: Record<Author, { name: string; photo: string }> = {
  blue: { name: "John S.", photo: "/assets/know/pin-blue.jpg" },
  orange: { name: "Liliana", photo: "/assets/know/pin-orange.jpg" },
};

/**
 * Marcador de presença: o avatar de quem está lendo o trecho, com um risco de
 * cursor embaixo. Fica solto sobre o parágrafo e o visitante pode arrastá-lo
 * dentro dele — a posição é guardada em % do bloco para sobreviver ao resize.
 */
function Pin({
  author,
  x,
  y,
}: {
  author: Author;
  /** Posição inicial, em % do elemento que contém o pin. */
  x: number;
  y: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [at, setAt] = useState({ x, y });

  const onPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    const pin = ref.current;
    const box = pin?.offsetParent;
    if (pin == null || !(box instanceof HTMLElement)) return;

    pin.setPointerCapture(event.pointerId);

    const rect = box.getBoundingClientRect();
    const move = (e: globalThis.PointerEvent) => {
      setAt({
        x: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)),
        y: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <span
      ref={ref}
      className="lp-know-pin"
      data-author={author}
      style={{ left: `${at.x}%`, top: `${at.y}%` }}
      onPointerDown={onPointerDown}
      role="img"
      aria-label={`Cursor de ${AUTHORS[author].name}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- arte solta em public */}
      <img src={AUTHORS[author].photo} alt="" draggable={false} />
      <i aria-hidden />
    </span>
  );
}

/** Botões da barra que aparece sobre o trecho selecionado. */
const TOOLS = ["B", "I", "U", "S", "@"];

/** Recorta uma fatia do percurso da seção e a devolve normalizada de 0 a 1. */
function span(progress: number, from: number, to: number) {
  return Math.min(1, Math.max(0, (progress - from) / (to - from)));
}

export function Knowledge() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  // Progresso da seção pela viewport, de 0 (chegando por baixo) a 1 (saindo por
  // cima). É o relógio de tudo que anima aqui.
  useEffect(() => {
    const section = sectionRef.current;
    if (section == null) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const span = rect.height + window.innerHeight;
      setProgress(Math.min(1, Math.max(0, (window.innerHeight - rect.top) / span)));
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /*
   * Cada animação ocupa uma fatia do percurso. Esticadas pelos 0 a 1 inteiros
   * elas só terminam com a seção saindo da tela; jogadas para o começo,
   * acontecem enquanto o card ainda sobe e o visitante não está olhando. As
   * fatias abaixo caem depois de o card grudar no topo.
   */
  const card = span(progress, 0.28, 0.52);
  const mark = span(progress, 0.55, 0.75);
  const tools = mark > 0.95;

  return (
    <section id="conhecimento" className="lp-know" ref={sectionRef}>
      <div className="lp-know-inner">
        <div className="lp-know-art" data-reveal>
          <div className="lp-know-stick">
            <RiveAnim
              src="/animations/cards.riv"
              className="lp-know-cards"
              fit="contain"
              progress={card}
              matchArtboard
            />

            {/*
              O .riv desenha o card e a metade branca, mas não guarda texto
              nenhum — só a fonte. Os dois títulos vivem aqui e se revezam junto
              com a transição.
            */}
            <div className="lp-know-card-txt" data-on={card < 0.5}>
              <strong>Colabore</strong>
              <span>
                Potencialize o trabalho em equipe com recursos de colaboração em
                tempo real.
              </span>
            </div>

            <div className="lp-know-card-txt" data-on={card >= 0.5}>
              <strong>Histórico de versões</strong>
              <span>
                Acompanhe cada edição sem esforço e nunca perca uma alteração.
              </span>
            </div>
          </div>
        </div>

        <div className="lp-know-col">
          <h2 data-reveal className="lp-know-title">
            Conhecimento ao alcance
            <br />
            da sua equipe.
            <Pin author="blue" x={46} y={8} />
          </h2>

          <p data-reveal className="lp-know-lead">
            A plataforma reúne tudo o que sua equipe precisa para criar e manter
            a documentação dos projetos. As ferramentas de edição colaborativa
            aceleram o trabalho do time.
          </p>

          <div className="lp-know-doc" data-reveal>
            <div className="lp-know-marked" style={{ "--mark": mark } as React.CSSProperties}>
              <div className="lp-know-tools" data-on={tools} aria-hidden>
                <span className="lp-know-tool-link">+ Link</span>
                {TOOLS.map((tool) => (
                  <span key={tool} className={`lp-know-tool-${tool}`}>
                    {tool}
                  </span>
                ))}
                <span className="lp-know-tool-hl" />
              </div>

              <p className="lp-know-p">
                <strong>Documentos</strong> podem ser usados para compartilhar
                materiais de referência, colaborar em planos e roadmaps,
                registrar atas de reunião e distribuir tarefas entre os
                responsáveis.
              </p>
            </div>

            <figure className="lp-know-fig">
              {/* eslint-disable-next-line @next/next/no-img-element -- arte solta em public */}
              <img src="/assets/know/billboard.jpg" alt="" loading="lazy" />
            </figure>

            <p className="lp-know-p lp-know-p-pinned">
              Com colaboração em tempo real, equipes remotas constroem uma visão
              única na mesma página. Marcar pessoas, vincular issues e atribuir
              tarefas são apenas parte dos recursos do editor.
              <Pin author="orange" x={52} y={30} />
            </p>

            <pre className="lp-know-code">
              <code>
                <span className="k">interface</span>{" "}
                <span className="t">User</span> {"{"}
                {"\n  "}name: <span className="t">string</span>;
                {"\n  "}age: <span className="t">number</span>;
                {"\n}"}
              </code>
            </pre>

            <p className="lp-know-p">
              Documentos aceitam formatação rica, imagens, anexos e blocos de
              código. Use-os para organizar os planos da equipe, criar
              documentação técnica e acompanhar o progresso rumo às metas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
