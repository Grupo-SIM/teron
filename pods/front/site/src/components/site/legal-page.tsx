import type { ReactNode } from "react";
import { Localized, defaultLocale, type Locale } from "@/i18n/site";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { LegalPageScrollReset } from "./LegalPageScrollReset";

/**
 * Moldura das páginas de texto legal (termos, privacidade). São páginas de
 * leitura: nada de animação de entrada aqui — o conteúdo precisa estar visível
 * já na primeira pintura, inclusive sem JS.
 */
type LegalPageProps = {
  title: string;
  /** Data por extenso, ex.: "11 de agosto de 2026". */
  updatedAt: string;
  intro: string;
  children: ReactNode;
  locale?: Locale;
};

export function LegalPage({
  title,
  updatedAt,
  intro,
  children,
  locale = defaultLocale,
}: LegalPageProps) {
  return (
    <Localized locale={locale}><div className="lp-legal-page">
      <LegalPageScrollReset />
      <SiteHeader />

      <main className="lp-legal">
        <h1 className="lp-legal-title">{title}</h1>
        <p className="lp-legal-date">Última atualização: {updatedAt}</p>
        <p className="lp-legal-intro">{intro}</p>
        {children}
      </main>

      <SiteFooter />
    </div></Localized>
  );
}

/** Seção numerada do documento. O número vem do próprio texto do título. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="lp-legal-sec">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
