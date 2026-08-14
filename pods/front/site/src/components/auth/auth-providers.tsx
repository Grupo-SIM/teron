import { Localized, defaultLocale, type Locale } from "@/i18n/site";

/* eslint-disable @next/next/no-img-element -- marcas de 22px servidas de
   `public`, já no tamanho em que são desenhadas. */

/*
 * Segunda via de acesso do card: régua "OU" e os dois provedores lado a lado.
 * A linha da esquerda é um gradiente que acende para fora e a da direita é
 * chapada, como no original — as duas iguais achatariam o texto do meio.
 *
 * As marcas são as do teron.io: monocromáticas, num degradê de branco para
 * branco a 60%. O "G" colorido do Google puxaria o olho para longe do botão
 * principal, que é onde a tela quer levar.
 *
 * Os links entram pela SPA para que ela use a URL de contas configurada no
 * ambiente e conclua o OAuth pelo mesmo fluxo do login original.
 */
type AuthProvidersProps = {
  /** Prefixo do rótulo: "Entrar" em `/entrar`, "Cadastrar" em `/cadastro`. */
  action: string;
  flowHref: "/login" | "/login/signup";
  locale?: Locale;
};

export function AuthProviders({ action, flowHref, locale = defaultLocale }: AuthProvidersProps) {
  return (
    <Localized locale={locale}><>
      <div className="auth-or">
        <span className="auth-or-line auth-or-line--l" />
        <span className="auth-or-label">ou</span>
        <span className="auth-or-line auth-or-line--r" />
      </div>

      <div className="auth-providers">
        <a href={`${flowHref}?provider=google`} className="auth-provider">
          <img
            src="/assets/auth/google.svg"
            width={22}
            height={22}
            alt=""
            aria-hidden
          />
          <span>{`${action} com Google`}</span>
        </a>
        <a href={`${flowHref}?provider=github`} className="auth-provider">
          <img
            src="/assets/auth/github.svg"
            width={22}
            height={22}
            alt=""
            aria-hidden
          />
          <span>{`${action} com GitHub`}</span>
        </a>
      </div>
    </></Localized>
  );
}
