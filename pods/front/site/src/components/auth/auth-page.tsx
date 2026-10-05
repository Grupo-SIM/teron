import Link from "next/link";

import { Asset } from "@/components/site/asset";
import { Localized, defaultLocale, type Locale } from "@/i18n/site";

import { AuthDecor } from "./auth-decor";
import { AuthFlow } from "./auth-flow";
import "./auth.css";

/*
 * Moldura das telas de acesso, disponível em `/entrar` e `/cadastro`: um
 * card escuro sozinho no meio da tela, com o link de volta no canto e os
 * documentos legais no rodapé.
 *
 * Entrar e cadastrar são a mesma tela com outras palavras — no original a
 * diferença é só o título, o rótulo do botão e a chamada de baixo. Por isso as
 * duas rotas montam este mesmo componente e o que muda mora na tabela abaixo,
 * em vez de virar dois arquivos quase iguais.
 */
export type AuthVariant = "login" | "signup";

const COPY = {
  login: {
    switchText: "authPage.loginPrompt",
    switchLabel: "common.signUp",
    switchHref: "/cadastro",
  },
  signup: {
    switchText: "authPage.signupPrompt",
    switchLabel: "common.signIn",
    switchHref: "/entrar",
  },
} as const satisfies Record<AuthVariant, unknown>;

export function AuthPage({ variant, locale = defaultLocale }: { variant: AuthVariant; locale?: Locale }) {
  const copy = COPY[variant];

  return (
    <Localized locale={locale}><div className="auth-page">
      <header className="auth-topbar">
        <Link href="/" className="auth-home">
          <BackArrow />
          {"common.home"}</Link>
      </header>

      <section className="auth-stage">
        <div className="auth-card auth-card--flow">
          <main className="auth-card-body">
            <Asset
              src="/assets/brand/logo-horizontal-light.svg"
              alt="Teron"
              ratio="1694 / 479"
              className="auth-logo"
            />
            <AuthFlow variant={variant} locale={locale} />
          </main>

          <AuthDecor />
        </div>

        <p className="auth-switch">
          <span>{copy.switchText}</span>
          <Link href={copy.switchHref}>{copy.switchLabel}</Link>
        </p>

        <div className="auth-legal">
          <Link href="/termos">{"common.termsOfUse"}</Link>
          <span aria-hidden className="auth-legal-sep" />
          <Link href="/privacidade">{"common.privacy"}</Link>
        </div>
      </section>
    </div></Localized>
  );
}

function BackArrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 11 10"
      fill="none"
      aria-hidden
      width="11"
      height="10"
    >
      <path stroke="currentColor" strokeWidth="1.4" d="M11 5H1m0 0 4-4M1 5l4 4" />
    </svg>
  );
}
