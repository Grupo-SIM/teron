/* eslint-disable @next/next/no-img-element -- SVG/JPEG de tamanho fixo servidos
   de `public`; o `next/image` só acrescentaria trabalho de otimização a
   arquivos que já vêm no tamanho exato em que são desenhados. */

/*
 * Camadas decorativas do card, na mesma ordem e nas mesmas posições do
 * huly.io. Nenhuma delas responde ao ponteiro nem entra na leitura: ficam
 * atrás do conteúdo (`z-index` negativo) e todas partem daqui para não se
 * misturarem ao formulário.
 *
 * - `aurora`: a mancha azul/violeta que passa por trás do card;
 * - `form-pattern`: o fundo do card, com o brilho no canto superior direito e
 *   a trama de pontos;
 * - `form-border`: o aro do card, aceso no topo e à esquerda.
 */
export function AuthDecor() {
  return (
    <div className="auth-decor" aria-hidden>
      <img
        className="auth-aurora"
        src="/assets/auth/aurora.svg"
        width={1403}
        height={1000}
        alt=""
      />
      <div className="auth-card-frame">
        <img
          className="auth-card-pattern"
          src="/assets/auth/form-pattern.jpg"
          width={480}
          height={479}
          alt=""
        />
        <img
          className="auth-card-border"
          src="/assets/auth/form-border.svg"
          width={480}
          height={479}
          alt=""
        />
      </div>
    </div>
  );
}

/*
 * Luzes ao redor do botão principal. No original elas não pertencem ao botão:
 * encostam na linha do campo de e-mail (`--tr`/`--tl`), no aro externo do card
 * (`--outer`), e na fileira dos provedores (`--br`/`--bl`), como se o botão
 * iluminasse o que está em volta.
 *
 * Cada par tem uma versão para cada lado, e a opacidade das duas é cruzada por
 * `--btn-r`/`--btn-l` — as mesmas variáveis que movem o halo —, então a luz
 * troca de lado junto com o cursor. Some abaixo de 768px, igual ao original.
 */
export function AuthButtonLights() {
  return (
    <div className="auth-btn-lights" aria-hidden>
      <img
        className="auth-btn-light auth-btn-light--tr"
        src="/assets/auth/button-light-r.svg"
        width={193}
        height={42}
        alt=""
      />
      <img
        className="auth-btn-light auth-btn-light--tl"
        src="/assets/auth/button-light-l.svg"
        width={193}
        height={42}
        alt=""
      />
      <img
        className="auth-btn-light auth-btn-light--outer"
        src="/assets/auth/form-outer-light.svg"
        width={480}
        height={614}
        alt=""
      />
      <span className="auth-btn-hair auth-btn-hair--l" />
      <span className="auth-btn-hair auth-btn-hair--r" />
      <img
        className="auth-btn-light auth-btn-light--br"
        src="/assets/auth/button-light-br.svg"
        width={184}
        height={42}
        alt=""
      />
      <img
        className="auth-btn-light auth-btn-light--bl"
        src="/assets/auth/button-light-bl.svg"
        width={184}
        height={42}
        alt=""
      />
    </div>
  );
}
