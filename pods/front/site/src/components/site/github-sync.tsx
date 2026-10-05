import type { ReactNode } from "react";
import { Localized, defaultLocale, type Locale } from "@/i18n/site";

import { HeroCta } from "./hero-cta";

/**
 * Seção de integração com o GitHub, no mesmo arranjo do teron.io: título curto,
 * a janela sob um brilho laranja/azul e a grade de seis recursos embaixo.
 *
 * A janela não é um print: é o `Terongit.mp4`, que alterna entre o quadro de
 * tarefas e a lista do GitHub — os dois lados da sincronização. O brilho ao
 * redor vem de outro vídeo, que também desenha a moldura acesa.
 */

/**
 * Ícones da grade de recursos. Cada um traz seu próprio degradê; os `id` levam
 * o nome do recurso para não colidirem quando os seis vão para a mesma página.
 */
function Icon({ id, children }: { id: string; children: ReactNode }) {
  return (
    <svg className="lp-gh-feat-icon" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7db8ff" />
          <stop offset="1" stopColor="#1f5fe0" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>{children}</g>
    </svg>
  );
}

/*
 * Cada card ilustra um compromisso, e não um recurso, então o desenho segue o
 * texto: cadeado, marca, escudo, lente, boia e aperto de mão. Os títulos vêm em
 * duas partes porque a grade escreve a segunda numa linha própria — palavra
 * única deixa a segunda vazia e a linha continua reservada, mantendo os seis
 * cards com a mesma altura de texto.
 */
const FEATURES = [
  {
    id: "gh-security",
    icon: (
      <Icon id="gh-security">
        <path d="M16 2a7 7 0 0 0-7 7v4h3.2V9a3.8 3.8 0 1 1 7.6 0v4H23V9a7 7 0 0 0-7-7Z" />
        <path d="M7 13h18a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V15a2 2 0 0 1 2-2Zm9 5.5a2.6 2.6 0 0 0-1.3 4.85V26h2.6v-2.65A2.6 2.6 0 0 0 16 18.5Z" opacity=".7" />
      </Icon>
    ),
    title: ["integrations.features.security.title", "integrations.features.security.titleComplement"],
    text: "integrations.cards.privacy",
  },
  {
    id: "gh-belonging",
    icon: (
      <Icon id="gh-belonging">
        <path d="M16 2.5 27 8v9.5c0 6.4-4.4 10.9-11 12.5-6.6-1.6-11-6.1-11-12.5V8l11-5.5Z" opacity=".45" />
        <path d="M16 9.5c-2.6-2.6-6.6-.9-6.6 2.4 0 3.2 3.6 5.9 6.6 8.1 3-2.2 6.6-4.9 6.6-8.1 0-3.3-4-5-6.6-2.4Z" />
      </Icon>
    ),
    title: ["integrations.features.belonging.title", ""],
    text: "integrations.cards.identity",
  },
  {
    id: "gh-trust",
    icon: (
      <Icon id="gh-trust">
        <path d="M16 2 5 6.6v8.9c0 6.8 4.5 12.4 11 14.5 6.5-2.1 11-7.7 11-14.5V6.6L16 2Z" opacity=".45" />
        <path d="m14.5 20.7-4.3-4.3 2.1-2.1 2.2 2.2 6.6-6.6 2.1 2.1-8.7 8.7Z" />
      </Icon>
    ),
    title: ["integrations.features.trust.title", ""],
    text: "integrations.cards.trust",
  },
  {
    id: "gh-transparency",
    icon: (
      <Icon id="gh-transparency">
        <path d="M16 6C8.8 6 3.4 11.4 1.5 16c1.9 4.6 7.3 10 14.5 10s12.6-5.4 14.5-10C28.6 11.4 23.2 6 16 6Zm0 3.2c5.1 0 9.3 3.5 11.1 6.8-1.8 3.3-6 6.8-11.1 6.8S6.7 19.3 4.9 16C6.7 12.7 10.9 9.2 16 9.2Z" opacity=".55" />
        <circle cx="16" cy="16" r="4.2" />
      </Icon>
    ),
    title: ["integrations.features.transparency.title", ""],
    text: "integrations.cards.transparency",
  },
  {
    id: "gh-support",
    icon: (
      <Icon id="gh-support">
        <path d="M16 2a12 12 0 0 0-12 12v6.5a3.5 3.5 0 0 0 3.5 3.5H10V14H7.2a8.8 8.8 0 0 1 17.6 0H22v10h2.5A3.5 3.5 0 0 0 28 20.5V14A12 12 0 0 0 16 2Z" opacity=".55" />
        <path d="M13.5 26h5a2.5 2.5 0 0 1 0 5h-5a2.5 2.5 0 0 1 0-5ZM6 14h4v10H6V14Zm16 0h4v10h-4V14Z" />
      </Icon>
    ),
    title: ["integrations.features.support.title", ""],
    text: "integrations.cards.support",
  },
  {
    id: "gh-commitment",
    icon: (
      <Icon id="gh-commitment">
        <path d="M2 11.5 8 9l6.4 4.2a2 2 0 0 1 .3 3.1l-.2.2a2 2 0 0 1-2.6.1L8.6 14v9.4L2 20.8V11.5Z" opacity=".55" />
        <path d="M30 11.5 24 9l-6.9 3.6-3 2.4 2.5 2.2 3.5-2.3 6.3 5.4a1.9 1.9 0 0 1-2.4 2.9l.6.5a1.9 1.9 0 0 1-2.5 2.8 1.9 1.9 0 0 1-2.6 2.6 1.9 1.9 0 0 1-3 .5l-3.1-2.7V14l6.6 4.6L30 20.8V11.5Z" />
      </Icon>
    ),
    title: ["integrations.features.commitment.title", ""],
    text: "integrations.cards.relationship",
  },
];

export function GithubSync({ locale = defaultLocale }: { locale?: Locale }) {
  return (
    <Localized locale={locale}><section id="github" className="lp-gh">
      <div className="lp-gh-inner">
        <h2 data-reveal className="lp-gh-title">
          {"integrations.title"}<br />
          {"integrations.titleComplement"}</h2>

        <p data-reveal className="lp-gh-lead">
          {"integrations.description"}</p>

        <div className="lp-gh-shot" data-reveal>
          {/*
            Brilho laranja/azul por trás da janela. O vídeo é preto com as duas
            luzes e a moldura acesa, então entra em `screen`: soma luz sobre a
            página e o preto não pinta nada. O recorte da moldura dele é o que
            posiciona a janela — as medidas estão no CSS.
          */}
          <video
            className="lp-gh-glow"
            src="/assets/gh-glow.webm"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />

          {/* 1872x1080 é exatamente a proporção da janela (960/554), então o
              vídeo preenche sem sobrar borda. */}
          <div className="lp-gh-window">
            <video
              className="lp-gh-art"
              src="/assets/gh-window.mp4"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
            />
          </div>
        </div>

        <ul className="lp-gh-feats">
          {FEATURES.map((feat) => (
            <li key={feat.id} className="lp-gh-feat" data-reveal>
              {feat.icon}
              <h3 className="lp-gh-feat-title">
                {feat.title[0]}
                <br />
                {feat.title[1]}
              </h3>
              <p className="lp-gh-feat-txt">{feat.text}</p>
            </li>
          ))}
        </ul>

        {/* Última parada antes do fechamento da página: quem leu até aqui já
            sabe o que a plataforma faz e a pergunta que sobra é o preço. */}
        <p data-reveal className="lp-gh-actions">
          <HeroCta href="/precos" label="integrations.cta" />
        </p>
      </div>
    </section></Localized>
  );
}
