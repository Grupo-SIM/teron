import type { ReactNode } from "react";

/**
 * Seção de integração com o GitHub, no mesmo arranjo do huly.io: título curto,
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

const FEATURES = [
  {
    id: "gh-sync",
    icon: (
      <Icon id="gh-sync">
        <path d="M16 3a13 13 0 0 0-9.2 22.2l2.8-2.8A9 9 0 0 1 16 7v4l7-5.5L16 0v3Z" />
        <path
          d="M16 29a13 13 0 0 0 9.2-22.2l-2.8 2.8A9 9 0 0 1 16 25v-4l-7 5.5L16 32v-3Z"
          opacity=".65"
        />
      </Icon>
    ),
    title: ["Sincronização", "nos dois sentidos"],
    text: "Ligue o gerenciador de tarefas ao GitHub e veja cada mudança refletida nos dois lados na hora.",
  },
  {
    id: "gh-private",
    icon: (
      <Icon id="gh-private">
        <circle cx="8" cy="8" r="3.4" />
        <circle cx="24" cy="8" r="3.4" opacity=".55" />
        <circle cx="16" cy="16" r="3.4" />
        <circle cx="8" cy="24" r="3.4" opacity=".55" />
        <circle cx="24" cy="24" r="3.4" />
        <path
          d="M9.6 9.6 14.4 14.4M17.6 17.6 22.4 22.4M22.4 9.6 17.6 14.4M14.4 17.6 9.6 22.4"
          stroke="url(#gh-private)"
          strokeWidth="1.6"
        />
      </Icon>
    ),
    title: ["Tarefas", "privadas"],
    text: "Mantenha no seu espaço as tarefas que não devem sair para o repositório público.",
  },
  {
    id: "gh-repos",
    icon: (
      <Icon id="gh-repos">
        <path d="M16 2 30 8.5 16 15 2 8.5 16 2Z" />
        <path d="M16 17.2 4.6 12l-2.6 1.2L16 20l14-6.8-2.6-1.2L16 17.2Z" opacity=".7" />
        <path d="M16 24.4 4.6 19.2 2 20.4 16 27l14-6.6-2.6-1.2L16 24.4Z" opacity=".45" />
      </Icon>
    ),
    title: ["Múltiplos", "repositórios"],
    text: "Conecte quantos repositórios o time precisar e organize todos em um único painel.",
  },
  {
    id: "gh-milestone",
    icon: (
      <Icon id="gh-milestone">
        <path d="M16 2a14 14 0 1 0 0 28 14 14 0 0 0 0-28Zm0 3a11 11 0 1 1 0 22 11 11 0 0 1 0-22Z" />
        <path d="M21.5 10.5 13 13l-2.5 8.5L19 19l2.5-8.5Z" />
      </Icon>
    ),
    title: ["Migração de", "milestones"],
    text: "Leve marcos e etapas de um repositório para outro sem refazer o planejamento na mão.",
  },
  {
    id: "gh-progress",
    icon: (
      <Icon id="gh-progress">
        <path d="M15 2 3 14l4 4L19 6l-4-4Z" />
        <path d="M20 8 8 20l4 4L24 12l-4-4Z" opacity=".7" />
        <path d="M25 14 13 26l4 4 12-12-4-4Z" opacity=".45" />
      </Icon>
    ),
    title: ["Acompanhe", "o progresso"],
    text: "Veja contribuições e alterações do repositório dentro do próprio espaço de trabalho.",
  },
  {
    id: "gh-filter",
    icon: (
      <Icon id="gh-filter">
        <rect x="3" y="3" width="7" height="7" rx="1.6" />
        <rect x="12.5" y="3" width="7" height="7" rx="1.6" opacity=".55" />
        <rect x="22" y="3" width="7" height="7" rx="1.6" />
        <rect x="3" y="12.5" width="7" height="7" rx="1.6" opacity=".55" />
        <rect x="12.5" y="12.5" width="7" height="7" rx="1.6" />
        <rect x="22" y="12.5" width="7" height="7" rx="1.6" opacity=".55" />
        <rect x="3" y="22" width="7" height="7" rx="1.6" />
        <rect x="12.5" y="22" width="7" height="7" rx="1.6" opacity=".55" />
        <rect x="22" y="22" width="7" height="7" rx="1.6" />
      </Icon>
    ),
    title: ["Filtros", "avançados"],
    text: "Encontre exatamente o que precisa com buscas e filtros combinados sobre os dados do projeto.",
  },
];

export function GithubSync() {
  return (
    <section id="github" className="lp-gh">
      <div className="lp-gh-inner">
        <h2 data-reveal className="lp-gh-title">
          Sincronize com o GitHub.
          <br />
          Nos dois sentidos.
        </h2>

        <p data-reveal className="lp-gh-lead">
          Gerencie as tarefas do time com sincronização bidirecional. Use a
          plataforma como interface avançada para issues e projetos do GitHub.
        </p>

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
      </div>
    </section>
  );
}
