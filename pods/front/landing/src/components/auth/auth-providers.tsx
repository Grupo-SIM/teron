/* eslint-disable @next/next/no-img-element -- marcas de 22px servidas de
   `public`, já no tamanho em que são desenhadas. */

/*
 * Segunda via de acesso do card: régua "OU" e os dois provedores lado a lado.
 * A linha da esquerda é um gradiente que acende para fora e a da direita é
 * chapada, como no original — as duas iguais achatariam o texto do meio.
 *
 * As marcas são as do huly.io: monocromáticas, num degradê de branco para
 * branco a 60%. O "G" colorido do Google puxaria o olho para longe do botão
 * principal, que é onde a tela quer levar.
 *
 * Os botões ainda não levam a lugar nenhum: esta é a versão visual das telas.
 * Quando o acesso for ligado, cada um vira link para `<account>/auth/google` e
 * `<account>/auth/github` — é só trocar o `<button>` por `<a href>`, o resto
 * do estilo não muda.
 */
type AuthProvidersProps = {
  /** Prefixo do rótulo: "Entrar" em `/entrar`, "Cadastrar" em `/cadastro`. */
  action: string;
};

export function AuthProviders({ action }: AuthProvidersProps) {
  return (
    <>
      <div className="auth-or">
        <span className="auth-or-line auth-or-line--l" />
        <span className="auth-or-label">ou</span>
        <span className="auth-or-line auth-or-line--r" />
      </div>

      <div className="auth-providers">
        <button type="button" className="auth-provider">
          <img
            src="/assets/auth/google.svg"
            width={22}
            height={22}
            alt=""
            aria-hidden
          />
          <span>{`${action} com Google`}</span>
        </button>
        <button type="button" className="auth-provider">
          <img
            src="/assets/auth/github.svg"
            width={22}
            height={22}
            alt=""
            aria-hidden
          />
          <span>{`${action} com GitHub`}</span>
        </button>
      </div>
    </>
  );
}
