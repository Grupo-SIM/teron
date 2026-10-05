"use client";

import { usePillGlow } from "./use-pill-glow";

/*
 * Réplica do botão "See in Action" do teron.io. O halo que segue o cursor mora
 * em `usePillGlow` — as telas de acesso usam o mesmo botão.
 */
type HeroCtaProps = {
  href?: string;
  label?: string;
};

export function HeroCta({
  href = "/cadastro",
  label = "common.getStarted",
}: HeroCtaProps) {
  const wrapRef = usePillGlow<HTMLSpanElement>();

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
