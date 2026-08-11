"use client";

import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
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

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Progresso de 0 a 1 de um bloco atravessando a tela, medido pelo topo dele:
 * 0 enquanto está em `from` (fração da altura da janela, de cima para baixo) e
 * 1 ao alcançar `to`. Assim cada efeito começa quando o próprio bloco aparece,
 * e não quando a seção inteira entra — que era o que fazia a animação rodar
 * fora do campo de visão.
 */
function useEnter(
  ref: RefObject<HTMLElement | null>,
  from: number,
  to: number,
) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (el == null) return;

    let tick = 0;

    const measure = () => {
      tick = 0;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      const start = vh * from;
      const end = vh * to;

      setProgress(clamp((start - top) / (start - end)));
    };

    const onScroll = () => {
      if (tick === 0) tick = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(tick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, from, to]);

  return progress;
}

/**
 * Onde a descida começa, em fração da altura da janela: 0.8 é a coluna ainda
 * apontando na parte de baixo da tela. Esperar o topo da coluna alcançar o topo
 * da tela deixava o card parado por uma tela inteira de rolagem.
 */
const START = 0.8;

/**
 * Peso da parte linear da descida; o resto é quadrático. A 1 o card desceria em
 * velocidade constante — e como o curso é quase tão longo quanto a rolagem que
 * sobra, essa velocidade fica perto da da página e o card parece pregado na
 * tela. Com 0.78 ele desce fundo desde cedo e ainda sobra folga para acelerar
 * no fim, quando precisa alcançar a base do documento.
 */
const EASE = 0.78;

/**
 * Fatia do documento em que a face do card troca, medida pelo centro dele.
 * Quanto mais larga, mais lenta a virada: a faixa é o tempo da animação.
 */
const FACE = { from: 0.22, to: 0.72 };

export function Knowledge() {
  const railRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const [face, setFace] = useState(0);

  /*
   * O card desce pela coluna enquanto a página rola. A posição é escrita direto
   * no nó, sem passar por estado, e o curso é remedido a cada quadro: depender
   * de uma altura guardada congela o card se a medição acontecer antes de o
   * layout assentar — falha silenciosa, sem erro nenhum.
   *
   * O curso acaba com a base do card na base do documento, e é medido contra o
   * documento em si — não contra a coluna. As duas bordas coincidem hoje, mas só
   * porque o documento é o último bloco da coluna vizinha; medir o alvo de fato
   * mantém o encaixe se algo entrar embaixo dele.
   *
   * A posição persegue o alvo 12% por quadro em vez de saltar: é o
   * amortecimento, que `transition` não daria porque o alvo muda a cada evento
   * de scroll e cada mudança reiniciaria a curva do zero.
   */
  useEffect(() => {
    const rail = railRef.current;
    const card = cardRef.current;
    const doc = docRef.current;
    if (rail == null || card == null || doc == null) return;

    let tick = 0;
    let chase = 0;
    let target = 0;
    let now = 0;

    const glide = () => {
      const gap = target - now;
      const arrived = Math.abs(gap) < 0.4;

      now = arrived ? target : now + gap * 0.12;
      card.style.transform = `translate3d(0, ${now}px, 0)`;

      chase = arrived ? 0 : requestAnimationFrame(glide);
    };

    const measure = () => {
      tick = 0;

      const vh = window.innerHeight;
      const railTop = rail.getBoundingClientRect().top;
      const docBox = doc.getBoundingClientRect();
      const height = card.offsetHeight;

      // Deslocamento que encosta a base do card na base do documento.
      const travel = Math.max(0, docBox.bottom - railTop - height);

      /*
       * Começa com a coluna apontando na base da tela e fecha quando a base do
       * documento alcança a base da tela — só assim o card chega ao fim do
       * curso ainda em cena. Amarrado à rolagem que sobra, e não a uma taxa
       * fixa: com taxa fixa o card ficava pelo caminho, porque a seção acabava
       * antes de ele completar o curso.
       */
      const run = docBox.bottom - railTop - vh * (1 - START);
      const p = run > 0 ? clamp((vh * START - railTop) / run) : 0;

      target = travel * p * (EASE + (1 - EASE) * p);

      /*
       * A troca de face sai da posição do card dentro do documento, e não da
       * rolagem: assim ela acontece quando o card passa pelo meio do documento,
       * seja qual for a altura dos dois. O centro vem da conta acima em vez de
       * uma medição do card — o card está no meio do amortecimento e o valor
       * medido chegaria um quadro atrasado.
       */
      const middle = railTop + target + height / 2;
      const inDoc = (middle - docBox.top) / docBox.height;

      setFace(clamp((inDoc - FACE.from) / (FACE.to - FACE.from)));

      if (chase === 0) chase = requestAnimationFrame(glide);
    };

    const onScroll = () => {
      if (tick === 0) tick = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(tick);
      cancelAnimationFrame(chase);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const mark = useEnter(markRef, 0.68, 0.38);
  const tools = mark > 0.95;

  return (
    <section id="conhecimento" className="lp-know">
      <div className="lp-know-inner">
        <div className="lp-know-art" data-reveal ref={railRef}>
          {/*
            O card desce pela coluna conforme a página rola, mais devagar que a
            rolagem, e para com a base dele na base do documento ao lado.
          */}
          <div className="lp-know-card" ref={cardRef}>
            <RiveAnim
              src="/animations/cards.riv"
              className="lp-know-cards"
              fit="contain"
              progress={face}
              matchArtboard
            />

            {/*
              O .riv desenha o card e a metade branca, mas não guarda texto
              nenhum — só a fonte. Os dois títulos vivem aqui e se revezam junto
              com a transição.
            */}
            <div className="lp-know-card-txt" data-on={face < 0.5}>
              <strong>Colabore</strong>
              <span>
                Potencialize o trabalho em equipe com recursos de colaboração em
                tempo real.
              </span>
            </div>

            <div className="lp-know-card-txt" data-on={face >= 0.5}>
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

          <div className="lp-know-doc" data-reveal ref={docRef}>
            <div
              className="lp-know-marked"
              ref={markRef}
              style={{ "--mark": mark } as React.CSSProperties}
            >
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
