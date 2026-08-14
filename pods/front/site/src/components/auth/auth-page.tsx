import Link from "next/link";

import { Asset } from "@/components/site/asset";
import { Localized, defaultLocale, type Locale } from "@/i18n/site";

import { AuthDecor } from "./auth-decor";
import { AuthForm } from "./auth-form";
import { AuthProviders } from "./auth-providers";
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
    title: "Entrar na Teron",
    submitLabel: "Entrar",
    providerAction: "Entrar",
    switchText: "Não tem uma conta?",
    switchLabel: "Cadastre-se",
    switchHref: "/cadastro",
    flowHref: "/entrar",
  },
  signup: {
    title: "Criar nova conta",
    submitLabel: "Criar conta",
    providerAction: "Cadastrar",
    switchText: "Já tem uma conta?",
    switchLabel: "Entrar",
    switchHref: "/entrar",
    flowHref: "/cadastro",
  },
} as const satisfies Record<AuthVariant, unknown>;

export function AuthPage({ variant, locale = defaultLocale }: { variant: AuthVariant; locale?: Locale }) {
  const copy = COPY[variant];

  return (
    <Localized locale={locale}><div className="auth-page">
      <header className="auth-topbar">
        <Link href="/" className="auth-home">
          <BackArrow />
          Início
        </Link>
      </header>

      <section className="auth-stage">
        <div className="auth-card">
          <main className="auth-card-body">
            <Asset
              src="/assets/teronwhite.svg"
              alt="Teron"
              ratio="595 / 550"
              className="auth-logo"
            />
            <h1 className="auth-title">{copy.title}</h1>

            <AuthForm submitLabel={copy.submitLabel} flowHref={copy.flowHref} />
            <AuthProviders action={copy.providerAction} flowHref={copy.flowHref} />
          </main>

          <AuthDecor />
        </div>

        <p className="auth-switch">
          <span>{copy.switchText}</span>
          <Link href={copy.switchHref}>{copy.switchLabel}</Link>
        </p>

        <div className="auth-legal">
          <Link href="/termos">Termos de Uso</Link>
          <span aria-hidden className="auth-legal-sep" />
          <Link href="/privacidade">Política de Privacidade</Link>
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
