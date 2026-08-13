"use client";

import { usePillGlow } from "@/components/site/use-pill-glow";

import { AuthButtonLights } from "./auth-decor";

/*
 * Formulário do card: um campo de e-mail e o botão de ação. É só isso mesmo —
 * o teron.io pede o e-mail primeiro e resolve senha, código ou provedor no
 * passo seguinte, e as telas daqui seguem o mesmo caminho.
 *
 * O envio segue como GET para o fluxo original e preserva o e-mail na query.
 * A SPA assume dali em diante senha, OTP, cadastro e seleção de workspace.
 *
 * O botão repete a montagem do original: dois aros borrados espelhados por
 * cima (`auth-ring`), o miolo aceso recortado por dentro (`auth-btn-glow`) e
 * as luzes de fora (`AuthButtonLights`). `usePillGlow` cruza as opacidades
 * conforme o ponteiro anda.
 */
type AuthFormProps = {
  /** Rótulo do botão principal, ex.: "Entrar". */
  submitLabel: string;
  /** Entrada correspondente no fluxo de autenticação original. */
  flowHref: "/login" | "/login/signup";
};

export function AuthForm({ submitLabel, flowHref }: AuthFormProps) {
  const wrapRef = usePillGlow<HTMLDivElement>();

  return (
    <form className="auth-form" method="get" action={flowHref}>
      <label className="auth-label" htmlFor="email">
        E-mail
      </label>
      <div className="auth-input-row">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={320}
          placeholder="nome@empresa.com.br"
          className="auth-input"
        />
      </div>

      <div className="auth-submit-row">
        <div ref={wrapRef} className="auth-submit-wrap">
          <div className="auth-ring auth-ring--r">
            <div className="auth-ring-inner" />
          </div>
          <div className="auth-ring auth-ring--l">
            <div className="auth-ring-inner" />
          </div>

          <button type="submit" className="auth-submit">
            <span aria-hidden className="auth-btn-glow">
              <span className="auth-btn-glow-core" />
              <span className="auth-btn-glow-wide" />
            </span>
            <span className="auth-submit-label">{submitLabel}</span>
          </button>

          <AuthButtonLights />
        </div>
      </div>
    </form>
  );
}
