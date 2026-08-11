"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

/*
 * Texto que acende conforme a página desce.
 *
 * Cada palavra vira um `<span data-word>` com opacidade baixa; o motor marca
 * `data-lit` quando a palavra passa da linha de leitura. A transição fica no
 * CSS — aqui só entra o dado, para o scroll não pagar layout a cada quadro.
 *
 * O corte é por palavra e não por linha porque a quebra depende da largura da
 * tela: por palavra o efeito acompanha qualquer layout.
 *
 * Os ícones do meio do texto entram no mesmo motor, via `useReadLine`. Se cada
 * um tivesse o seu próprio observador, eles acenderiam por um critério
 * diferente do das palavras e apagariam fora de ordem ao subir.
 */

/** Altura da linha de leitura, em fração da janela, contada do topo. */
const READ_LINE = 0.62;

/*
 * Distância extra que cada ícone soma ao seu limite, na ordem em que aparecem
 * no texto. Sem isso, dois ícones da mesma linha acendem e apagam no mesmo
 * quadro; com isso a sequência é sempre a mesma, e ao subir eles sempre saem de
 * trás para frente.
 */
const STAGGER = 26;

type Subscriber = {
  el: HTMLElement;
  notify: (lit: boolean) => void;
  top: number;
  lit: boolean;
};

const subscribers = new Set<Subscriber>();
let words: { el: HTMLElement; top: number }[] = [];
let frame = 0;
let listening = false;

/*
 * Altura, no documento, até onde a leitura já chegou.
 *
 * A conta óbvia — `scrollY + altura * READ_LINE` — nasce valendo mais de meia
 * tela, e a página abriria com o primeiro parágrafo já aceso e os ícones dele
 * já abertos. Com a página no topo o valor tem que ser zero: nada foi lido
 * ainda.
 *
 * Daí a rampa: o segundo termo parte de zero e cresce até saturar na posição
 * de leitura. A velocidade dela importa — a um por um de scroll, o primeiro
 * parágrafo só acenderia depois de uma tela inteira, quando já estivesse
 * subindo para fora do quadro. Multiplicada, a linha alcança a posição de
 * leitura em cerca de um terço de tela e daí em diante acompanha o scroll.
 */
const RAMP = 3;

function readLine() {
  const reach = window.innerHeight * READ_LINE;
  return window.scrollY + Math.min(window.scrollY * RAMP, reach);
}

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/*
 * As posições são medidas de uma vez e guardadas: ler `getBoundingClientRect`
 * de centenas de spans a cada scroll trava a página.
 */
function measure() {
  const offset = window.scrollY;

  words = Array.from(document.querySelectorAll<HTMLElement>("[data-word]")).map(
    (el) => ({ el, top: el.getBoundingClientRect().top + offset }),
  );

  const ordered = [...subscribers].sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING
      ? -1
      : 1,
  );

  ordered.forEach((subscriber, rank) => {
    subscriber.top =
      subscriber.el.getBoundingClientRect().top + offset + rank * STAGGER;
  });

  paint();
}

function paint() {
  frame = 0;
  const line = readLine();

  for (const word of words) {
    const lit = word.top < line;
    if ((word.el.dataset.lit === "true") !== lit) {
      word.el.dataset.lit = String(lit);
    }
  }

  for (const subscriber of subscribers) {
    const lit = subscriber.top < line;
    if (lit !== subscriber.lit) {
      subscriber.lit = lit;
      subscriber.notify(lit);
    }
  }
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(paint);
}

function start() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure);
}

function stop() {
  if (!listening) return;
  listening = false;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", measure);
}

type WordsProps = {
  text: string;
};

/**
 * Quebra o texto em palavras marcadas. Renderiza no servidor: o recorte é
 * determinístico e não depende de medida de tela.
 */
export function Words({ text }: WordsProps) {
  const parts = text.split(/(\s+)/);

  return (
    <>
      {parts.map((part, index) =>
        /\s/.test(part) || part === "" ? (
          part
        ) : (
          <span key={index} data-word>
            {part}
          </span>
        ),
      )}
    </>
  );
}

type WordProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Trecho que acende como uma unidade só — usado quando quebrar em palavras
 * partiria um destaque (o degradê do nome do produto, por exemplo).
 */
export function Word({ children, className }: WordProps) {
  return (
    <span data-word className={className}>
      {children}
    </span>
  );
}

/**
 * Diz se o elemento já passou da linha de leitura. Mesma conta das palavras,
 * então ícone e texto acendem juntos e saem na mesma ordem.
 */
export function useReadLine(ref: RefObject<HTMLElement | null>) {
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el == null) return;

    // Sem animação o conteúdo entra aceso e o motor nem roda. Acender no quadro
    // seguinte, e não aqui, evita a renderização em cascata que um `setState`
    // dentro do efeito provoca.
    if (reduced()) {
      const id = requestAnimationFrame(() => setLit(true));
      return () => cancelAnimationFrame(id);
    }

    const subscriber: Subscriber = { el, notify: setLit, top: 0, lit: false };
    subscribers.add(subscriber);
    start();
    measure();

    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0 && words.length === 0) stop();
    };
  }, [ref]);

  return lit;
}

/**
 * Liga o motor para as palavras da página. Montado uma vez, no mesmo espírito
 * do `RevealObserver`.
 */
export function WordsObserver() {
  useEffect(() => {
    if (reduced()) return;

    start();
    measure();
    // A fonte só chega depois do primeiro quadro e muda a altura das linhas.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      words = [];
      if (subscribers.size === 0) stop();
    };
  }, []);

  return null;
}
