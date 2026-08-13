import { Asset } from "@/components/landing/asset";

import { AuthDecor } from "./auth-decor";
import { AuthForm } from "./auth-form";
import { AuthProviders } from "./auth-providers";
import "./auth.css";

/*
 * Moldura das telas de acesso, copiada de teron.io/login e teron.io/signup: um
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
  },
  signup: {
    title: "Criar nova conta",
    submitLabel: "Criar conta",
    providerAction: "Cadastrar",
    switchText: "Já tem uma conta?",
    switchLabel: "Entrar",
    switchHref: "/entrar",
  },
} as const satisfies Record<AuthVariant, unknown>;

export function AuthPage({ variant }: { variant: AuthVariant }) {
  const copy = COPY[variant];

  return (
    <div className="auth-page">
      <header className="auth-topbar">
        <a href="/" className="auth-home">
          <BackArrow />
          Início
        </a>
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

            <AuthForm submitLabel={copy.submitLabel} />
            <AuthProviders action={copy.providerAction} />
          </main>

          <AuthDecor />
        </div>

        <p className="auth-switch">
          <span>{copy.switchText}</span>
          <a href={copy.switchHref}>{copy.switchLabel}</a>
        </p>

        <div className="auth-legal">
          <a href="/termos">Termos de Uso</a>
          <span aria-hidden className="auth-legal-sep" />
          <a href="/privacidade">Política de Privacidade</a>
        </div>
      </section>
    </div>
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
