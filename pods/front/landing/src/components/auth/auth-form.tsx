"use client";

import { usePillGlow } from "@/components/landing/use-pill-glow";

import { AuthButtonLights } from "./auth-decor";

/*
 * Formulário do card: um campo de e-mail e o botão de ação. É só isso mesmo —
 * o teron.io pede o e-mail primeiro e resolve senha, código ou provedor no
 * passo seguinte, e as telas daqui seguem o mesmo caminho.
 *
 * Versão visual: o `submit` é barrado no `onSubmit`. O ponto de integração é
 * exatamente esse handler — quando o acesso for ligado, é dali que sai a
 * chamada ao serviço de contas, sem mexer no restante da árvore.
 *
 * `noValidate` deixa a validação para quem for ligar o formulário: sem isso o
 * navegador já barraria o envio com a bolha nativa, o que não tem nada a ver
 * com o desenho da tela.
 *
 * O botão repete a montagem do original: dois aros borrados espelhados por
 * cima (`auth-ring`), o miolo aceso recortado por dentro (`auth-btn-glow`) e
 * as luzes de fora (`AuthButtonLights`). `usePillGlow` cruza as opacidades
 * conforme o ponteiro anda.
 */
type AuthFormProps = {
  /** Rótulo do botão principal, ex.: "Entrar". */
  submitLabel: string;
};

export function AuthForm({ submitLabel }: AuthFormProps) {
  const wrapRef = usePillGlow<HTMLDivElement>();

  return (
    <form
      className="auth-form"
      noValidate
      onSubmit={(event) => {
        // TODO: ligar ao serviço de contas. Hoje as telas são só visuais.
        event.preventDefault();
      }}
    >
      <label className="auth-label" htmlFor="email">
        E-mail
      </label>
      <div className="auth-input-row">
        <input
          id="email"
          name="email"
          type="email"
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
