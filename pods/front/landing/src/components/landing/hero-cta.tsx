"use client";

import { useEffect, useRef } from "react";

/*
 * Réplica do halo do botão "See in Action" do huly.io: a luz laranja
 * acompanha o cursor dentro do botão. `--btn-r`/`--btn-l` cruzam a
 * opacidade das duas camadas do halo externo — uma com o gradiente normal
 * (quente à direita), outra espelhada (`scaleX(-1)`, quente à esquerda) —
 * para que o brilho pareça vir do lado onde o cursor está.
 *
 * Ao contrário do original (que espera 1s e volta pra direita), aqui a luz
 * fica onde o cursor a deixou: só muda de novo quando o mouse volta a
 * passar por cima.
 *
 * Enquanto o mouse se move por cima, um segundo brilho — quase branco,
 * dentro do botão, recortado pelo `overflow: hidden` do `.lp-btn-pill` —
 * acompanha o cursor via `--btn-x`. Uma vez aceso (primeiro `pointermove`)
 * ele não apaga mais: fica preso na última posição, igual ao halo parado.
 */
type HeroCtaProps = {
  href?: string;
  label?: string;
};

export function HeroCta({
  href = "/login/signup",
  label = "Começar agora",
}: HeroCtaProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);

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

  return (
    <span ref={wrapRef} className="lp-btn-pill-wrap">
      <span aria-hidden className="lp-btn-pill-halo lp-btn-pill-halo--r">
        <span className="lp-btn-pill-halo-ring" />
      </span>
      <span aria-hidden className="lp-btn-pill-halo lp-btn-pill-halo--l">
        <span className="lp-btn-pill-halo-ring" />
      </span>
      <a href={href} className="lp-btn-pill">
        <span aria-hidden className="lp-btn-pill-glow" />
        <span>{label}</span>
        <ArrowRight />
      </a>
    </span>
  );
}

function ArrowRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 17 9"
      fill="none"
      aria-hidden
      style={{ width: 17, height: 9, flex: "none" }}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="m12.495 0 4.495 4.495-4.495 4.495-.99-.99 2.805-2.805H0v-1.4h14.31L11.505.99z"
      />
    </svg>
  );
}
