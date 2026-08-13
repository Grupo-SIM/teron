"use client";

import { useEffect, useRef } from "react";

/*
 * Halo do botão-pílula do teron.io: a luz laranja acompanha o cursor dentro do
 * botão. `--btn-r`/`--btn-l` cruzam a opacidade das duas camadas do halo
 * externo — uma com o gradiente normal (quente à direita), outra espelhada
 * (`scaleX(-1)`, quente à esquerda) — para que o brilho pareça vir do lado
 * onde o cursor está.
 *
 * Ao contrário do original (que espera 1s e volta pra direita), aqui a luz
 * fica onde o cursor a deixou: só muda de novo quando o mouse volta a passar
 * por cima.
 *
 * Enquanto o mouse se move por cima, um segundo brilho — quase branco, dentro
 * do botão, recortado pelo `overflow: hidden` do `.lp-btn-pill` — acompanha o
 * cursor via `--btn-x`. Uma vez aceso (primeiro `pointermove`) ele não apaga
 * mais: fica preso na última posição, igual ao halo parado.
 *
 * O comportamento é idêntico no CTA do hero e no botão das telas de acesso, e
 * depende só das classes `lp-btn-pill-*`; por isso mora aqui e não em nenhum
 * dos dois componentes.
 */
export function usePillGlow<T extends HTMLElement>() {
  const wrapRef = useRef<T>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let half = 64;

    const apply = (offset: number) => {
      const clamped = Math.max(-half, Math.min(half, offset));
      el.style.setProperty("--btn-r", String(Math.max(0, clamped / half)));
      el.style.setProperty("--btn-l", String(Math.max(0, -clamped / half)));
      el.style.setProperty("--btn-x", `${clamped}px`);
    };

    const measure = () => {
      half = el.getBoundingClientRect().width / 2 - 6;
    };

    // estado inicial: luz parada à direita, igual ao original antes de
    // qualquer interação.
    measure();
    apply(half);

    const onMove = (event: PointerEvent) => {
      el.classList.add("lp-btn-pill-wrap--hover");
      const rect = el.getBoundingClientRect();
      apply(event.clientX - rect.left - rect.width / 2);
    };

    el.addEventListener("pointermove", onMove);
    window.addEventListener("resize", measure);

    return () => {
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return wrapRef;
}
