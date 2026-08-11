"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Régua horizontal de planos.
 *
 * Os cartões ficam lado a lado numa faixa que rola na horizontal e só um está
 * aceso por vez. O aceso troca a face chapada por um cartão de vidro e liga um
 * vídeo de raios atrás dele, na cor do plano; os apagados ficam no fundo
 * translúcido. Clicar num cartão traz ele para o centro.
 *
 * O vídeo é maior que o cartão de propósito — o raio precisa vazar por fora
 * para se ler como brilho, e é por isso que a faixa tem tanto respiro vertical:
 * `overflow-x` corta também na vertical.
 */

/**
 * Valores ainda não fechados. Quando a tabela sair, basta preencher `price`
 * (`{ int: "199", cents: "90" }`) que o cartão troca de "Em breve" para o
 * número — o espaço já está reservado no layout.
 */
type Plan = {
  name: string;
  slug: string;
  price: { int: string; cents?: string } | null;
  text: string;
  items: { label: string; tip?: string }[];
};

const PLANS: Plan[] = [
  {
    name: "Essencial",
    slug: "essencial",
    price: null,
    text: "Para pessoas e times dando os primeiros passos na Teron.",
    items: [
      { label: "Usuários ilimitados" },
      { label: "Objetos Teron ilimitados" },
      {
        label: "10GB de armazenamento",
        tip: "Vale por workspace. Conta anexos, imagens e vídeos; os objetos da Teron não ocupam essa cota.",
      },
      {
        label: "10GB de tráfego de mídia",
        tip: "Só chamadas de áudio e vídeo consomem tráfego de rede.",
      },
      { label: "IA — a definir" },
    ],
  },
  {
    name: "Time",
    slug: "time",
    price: null,
    text: "Para equipes que precisam de planejamento, calendário e integrações.",
    items: [
      { label: "Usuários ilimitados" },
      { label: "Objetos Teron ilimitados" },
      {
        label: "100GB de armazenamento",
        tip: "Vale por workspace. Conta anexos, imagens e vídeos; os objetos da Teron não ocupam essa cota.",
      },
      {
        label: "100GB de tráfego de mídia",
        tip: "Só chamadas de áudio e vídeo consomem tráfego de rede.",
      },
      { label: "IA — a definir" },
    ],
  },
  {
    name: "Empresa",
    slug: "empresa",
    price: null,
    text: "Para empresas e operações que exigem controle, suporte e escala.",
    items: [
      { label: "Usuários ilimitados" },
      { label: "Objetos Teron ilimitados" },
      {
        label: "1TB de armazenamento",
        tip: "Vale por workspace. Conta anexos, imagens e vídeos; os objetos da Teron não ocupam essa cota.",
      },
      {
        label: "500GB de tráfego de mídia",
        tip: "Só chamadas de áudio e vídeo consomem tráfego de rede.",
      },
      { label: "IA — a definir" },
    ],
  },
  {
    name: "Ilimitado",
    slug: "ilimitado",
    price: null,
    text: "Para várias equipes que precisam da capacidade máxima da plataforma.",
    items: [
      { label: "Usuários ilimitados" },
      { label: "Objetos Teron ilimitados" },
      {
        label: "10TB de armazenamento",
        tip: "Vale por workspace. Conta anexos, imagens e vídeos; os objetos da Teron não ocupam essa cota.",
      },
      {
        label: "2TB de tráfego de mídia",
        tip: "Só chamadas de áudio e vídeo consomem tráfego de rede.",
      },
      { label: "IA — a definir" },
    ],
  },
];

export function PricingPlans() {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  /*
   * Cada vídeo de raio pesa mais de 1MB e só aparece quando o cartão acende.
   * Aqui ficam os que já foram acesos alguma vez: o `<video>` dos outros nem
   * chega a ser montado, então a página não baixa os quatro de saída.
   */
  const [loaded, setLoaded] = useState<number[]>([0]);
  // Trava enquanto a rolagem suave do clique está em curso: sem ela o próprio
  // scroll roubaria o cartão aceso no meio do caminho.
  const scrolling = useRef(false);

  const activate = (index: number) => {
    setActive(index);
    setLoaded((seen) => (seen.includes(index) ? seen : [...seen, index]));
  };

  // O cartão aceso é o que parou mais perto do centro da faixa.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let frame = 0;

    const pick = () => {
      frame = 0;
      if (scrolling.current) return;

      const middle = rail.getBoundingClientRect().left + rail.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;

      rail.querySelectorAll<HTMLElement>("[data-card]").forEach((el, index) => {
        const card = el.getBoundingClientRect();
        const distance = Math.abs(card.left + card.width / 2 - middle);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });

      setActive(best);
      setLoaded((seen) => (seen.includes(best) ? seen : [...seen, best]));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(pick);
    };

    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const focus = (index: number) => {
    activate(index);

    const rail = railRef.current;
    const card = rail?.querySelectorAll<HTMLElement>("[data-card]")[index];
    if (!rail || !card) return;

    const shift =
      card.getBoundingClientRect().left -
      rail.getBoundingClientRect().left +
      card.offsetWidth / 2 -
      rail.clientWidth / 2;

    scrolling.current = true;
    rail.scrollTo({ left: rail.scrollLeft + shift, behavior: "smooth" });
    setTimeout(() => {
      scrolling.current = false;
    }, 500);
  };

  return (
    <div className="lp-pr-rail-wrap">
      <h2 className="lp-pr-sr">Planos da Teron</h2>
      <div ref={railRef} className="lp-pr-rail">
        <div className="lp-pr-track">
          {PLANS.map((plan, index) => {
            const isActive = index === active;

            return (
              <article
                key={plan.slug}
                data-card
                data-active={isActive}
                className="lp-pr-card"
                onClick={() => focus(index)}
                onFocusCapture={() => activate(index)}
              >
                {/* Camadas de fundo, do mais atrás para o mais à frente. Quem
                    vem depois no DOM pinta por cima, então a ordem aqui é a
                    profundidade: raios, vidro do cartão, conteúdo. */}
                <span aria-hidden className="lp-pr-bolt">
                  {loaded.includes(index) ? (
                    <video
                      className="lp-pr-bolt-video"
                      width={1000}
                      height={1080}
                      autoPlay
                      muted
                      loop
                      playsInline
                    >
                      <source
                        src={`/videos/planos/${plan.slug}.mp4`}
                        type="video/mp4"
                      />
                      <source
                        src={`/videos/planos/${plan.slug}.webm`}
                        type="video/webm"
                      />
                    </video>
                  ) : null}
                </span>

                {/* Um SVG por plano: a face do cartão aceso é tingida com a
                    mesma cor do raio que corre em volta dele. */}
                <span aria-hidden className="lp-pr-glass">
                  {/* eslint-disable-next-line @next/next/no-img-element -- asset estático de tamanho fixo */}
                  <img src={`/assets/plan-card-${plan.slug}.svg`} alt="" />
                </span>

                <h3 className="lp-pr-name">{plan.name}</h3>

                <p className="lp-pr-price">
                  {plan.price ? (
                    <>
                      <span className="lp-pr-amount">R$ {plan.price.int}</span>
                      {plan.price.cents ? (
                        <span className="lp-pr-cents">,{plan.price.cents}</span>
                      ) : null}
                      <span className="lp-pr-per">/mensal</span>
                    </>
                  ) : (
                    <>
                      <span className="lp-pr-amount lp-pr-amount-soon">
                        Em breve
                      </span>
                      <span className="lp-pr-per">preço a definir</span>
                    </>
                  )}
                </p>

                <p className="lp-pr-txt">{plan.text}</p>

                <span aria-hidden className="lp-pr-rule" />

                <ul className="lp-pr-items">
                  {plan.items.map((item) => (
                    <li key={item.label}>
                      <svg viewBox="0 0 16 16" aria-hidden>
                        <path
                          d="m13.33 4-7.333 7.333L2.664 8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.829"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>
                        {item.label}
                        {item.tip ? <Tip text={item.tip} /> : null}
                      </span>
                    </li>
                  ))}
                </ul>

                <a href="/login/signup" className="lp-pr-cta">
                  Começar grátis
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Detalhe de cobrança que não cabe na linha do item. Fica atrás de um ícone
 * porque escrever tudo no cartão empurraria a lista para fora dele.
 */
function Tip({ text }: { text: string }) {
  return (
    <span
      className="lp-pr-tip"
      tabIndex={0}
      role="note"
      aria-label={text}
      onClick={(event) => event.stopPropagation()}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
        <path
          fill="currentColor"
          opacity=".22"
          d="M8.002 16.004A8.002 8.002 0 1 0 8.002 0a8.002 8.002 0 0 0 0 16.004"
        />
        <path
          fill="currentColor"
          d="M8.004 4.92c.576 0 .82-.308.82-.73v-.218c0-.423-.244-.73-.82-.73s-.832.307-.832.73v.218c0 .422.256.73.832.73M7.3 12.767h1.395V6.11H7.3v6.658Z"
        />
      </svg>
      <span className="lp-pr-tip-bubble">{text}</span>
    </span>
  );
}
