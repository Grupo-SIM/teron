"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";

import { useReadLine } from "./scroll-words";

/*
 * Chamada de contato do fim do texto.
 *
 * No arquivo Rive este trecho é um artboard com "Contact us" desenhado dentro
 * da arte — não dá para traduzir sem abrir o arquivo no editor. Aqui ele é um
 * link de verdade, com a entrada refeita em CSS: o avião chega deslizando, o
 * texto sobe e o sublinhado se desenha da esquerda para a direita.
 *
 * O gatilho é o mesmo `useReadLine` dos ícones, então ele entra na sequência do
 * texto e sai junto com o resto ao subir a página.
 */

type PricingContactProps = {
  href: string;
  children: ReactNode;
};

export function PricingContact({ href, children }: PricingContactProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const shown = useReadLine(ref);

  return (
    <Link ref={ref} href={href} className="lp-pr-contact" data-shown={shown}>
      <svg className="lp-pr-contact-plane" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M21.5 2.5 2.8 9.9c-.7.3-.6 1.3.1 1.5l5.4 1.6 1.6 5.4c.2.7 1.2.8 1.5.1L21.5 2.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M21.5 2.5 8.3 13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <span className="lp-pr-contact-text">{children}</span>
    </Link>
  );
}
