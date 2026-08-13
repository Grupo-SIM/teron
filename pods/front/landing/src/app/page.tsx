import { Asset } from "@/components/landing/asset";
import { Bento } from "@/components/landing/bento";
import { GithubSync } from "@/components/landing/github-sync";
import { HeroCta } from "@/components/landing/hero-cta";
import { Knowledge } from "@/components/landing/knowledge";
import { LoopFadeVideo } from "@/components/landing/loop-fade-video";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { RiveCard } from "@/components/landing/rive-card";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { VideoBlock } from "@/components/landing/video-block";

const PROBLEMS = [
  {
    icon: "/assets/icon-mail.png",
    title: ["Informações", "Desconectadas"],
    text: "Projetos, documentos e conversas ficam espalhados em diferentes ferramentas, dificultando o acesso ao que realmente importa.",
  },
  {
    icon: "/assets/icon-chat.png",
    title: ["Comunicação", "Sem Contexto"],
    text: "Mensagens, decisões e atualizações acontecem em vários canais, tornando o alinhamento da equipe mais lento e sujeito a falhas.",
  },
  {
    icon: "/assets/icon-person.png",
    title: ["Produtividade", "Comprometida"],
    text: "Mais tempo procurando informações e menos tempo executando. O resultado são atrasos, retrabalho e perda de eficiência.",
  },
];

const CAPABILITIES = [
  {
    title: ["Planejamento", "e Execução"],
    text: "Transforme ideias em entregas com gestão de projetos, tarefas, cronogramas, calendário da equipe e acompanhamento em tempo real para manter cada etapa sob controle.",
  },
  {
    title: ["Comunicação", "e Colaboração"],
    text: "Converse com sua equipe, realize reuniões por áudio e vídeo, compartilhe documentos e mantenha todas as decisões registradas no contexto de cada projeto.",
  },
  {
    title: ["Conhecimento", "Centralizado"],
    text: "Crie documentos colaborativos, registre processos, organize informações e construa uma base de conhecimento acessível para toda a empresa.",
  },
  {
    title: ["Automação e", "Inteligência"],
    text: "Automatize processos, utilize inteligência artificial, acompanhe indicadores e elimine tarefas repetitivas para que sua equipe foque no que realmente gera resultados.",
  },
];

export default function Home() {
  return (
    <div
      style={{
        position: "relative",
        background: "#000",
        color: "#fff",
        overflowX: "hidden",
        flex: 1,
      }}
    >
      <RevealObserver />
      <SiteHeader />

      {/* Hero ---------------------------------------------------------- */}
      <section
        style={{ position: "relative", paddingBottom: 120, overflow: "hidden" }}
      >
        {/* O frame existe só para dar altura à `.lp-hero-copy`: ela é
            absoluta e sua altura em % precisa resolver contra a caixa da
            mídia, não contra a seção (que tem padding-bottom). */}
        <div className="lp-hero-frame">
          <div className="lp-hero-copy">
            {/* tamanho, peso, entrelinha e espaçamento vivem no
                `globals.css` (`.lp-hero-copy h1/p`), onde os degraus do
                teron.io precisam de media query. */}
            <h1 data-reveal style={{ margin: 0 }}>
              Tudo o que sua equipe precisa. Em um só lugar.
            </h1>
            <p
              data-reveal
              style={{
                marginBottom: 0,
                color: "#a7a7ad",
              }}
            >
              Pare de alternar entre dezenas de ferramentas. Centralize
              projetos, tarefas, reuniões e comunicação em uma única plataforma
              para sua equipe produzir mais.
            </p>
            <div data-reveal className="lp-hero-cta">
              <HeroCta />
            </div>
          </div>

          <div className="lp-hero-media">
            <video
              className="lp-hero-video"
              src="/assets/hero.webm"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
            />
            <Asset
              src="/assets/hero-shot%20(1).png"
              alt=""
              ratio="2048 / 1138"
              className="lp-hero-shot"
            />
            <div aria-hidden className="lp-hero-fade" />
          </div>
        </div>
      </section>

      {/* Problema ------------------------------------------------------ */}
      <section id="problema" style={{ padding: "0 24px 130px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", textAlign: "center" }}>
          <h2
            data-reveal
            style={{
              margin: "0 auto",
              fontSize: "clamp(30px,3.9vw,52px)",
              lineHeight: 1.1,
              letterSpacing: "-.03em",
              fontWeight: 800,
              maxWidth: "18ch",
              textWrap: "balance",
            }}
          >
            Cada ferramenta resolve um problema. Juntas, elas criam outro.
          </h2>
          <p
            data-reveal
            style={{
              margin: "26px auto 0",
              fontSize: 17,
              lineHeight: 1.6,
              color: "#a7a7ad",
              maxWidth: "72ch",
            }}
          >
            Sua equipe alterna entre chats, planilhas, documentos, reuniões e
            aplicativos o dia inteiro. No meio desse processo, informações se
            perdem, decisões ficam sem contexto, tarefas atrasam e a
            produtividade diminui sem que ninguém perceba.
          </p>
          <div
            style={{
              marginTop: 64,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 22,
              textAlign: "left",
            }}
          >
            {PROBLEMS.map((card) => (
              <div
                key={card.title.join(" ")}
                data-reveal
                style={{
                  background: "#0c0c0e",
                  border: "1px solid rgba(255,255,255,.07)",
                  borderRadius: 14,
                  padding: "26px 26px 30px",
                }}
              >
                <Asset
                  src={card.icon}
                  alt=""
                  ratio="1 / 1"
                  style={{ width: 52, height: 52, display: "block" }}
                />
                <h3
                  style={{
                    margin: "20px 0 10px",
                    fontSize: 19,
                    fontWeight: 800,
                    letterSpacing: "-.01em",
                    lineHeight: 1.25,
                  }}
                >
                  {card.title[0]}
                  <br />
                  {card.title[1]}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#9a9aa1",
                  }}
                >
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plataforma ---------------------------------------------------- */}
      <section id="plataforma" style={{ padding: "0 24px 130px" }}>
        <div style={{ maxWidth: 1344, margin: "0 auto" }}>
          <h2
            data-reveal
            style={{
              margin: "0 auto",
              textAlign: "center",
              fontSize: "clamp(28px,3.6vw,48px)",
              lineHeight: 1.12,
              letterSpacing: "-.03em",
              fontWeight: 800,
              maxWidth: "22ch",
              textWrap: "balance",
            }}
          >
            Uma plataforma criada para simplificar a forma como as equipes
            trabalham.
          </h2>
          <div data-reveal style={{ marginTop: 70 }}>
            <Bento />
          </div>
        </div>
      </section>

      {/* Operação ------------------------------------------------------ */}
      <section id="operacao" style={{ padding: "0 24px 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", textAlign: "center" }}>
          <h2
            data-reveal
            style={{
              margin: "0 auto",
              fontSize: "clamp(28px,3.6vw,48px)",
              lineHeight: 1.12,
              letterSpacing: "-.03em",
              fontWeight: 800,
              maxWidth: "24ch",
              textWrap: "balance",
            }}
          >
            Muito mais do que gerenciar projetos. Um espaço completo para toda a
            sua operação.
          </h2>
          <p
            data-reveal
            style={{
              margin: "26px auto 0",
              fontSize: 17,
              lineHeight: 1.6,
              color: "#a7a7ad",
              maxWidth: "76ch",
            }}
          >
            Reúna tudo o que sua equipe precisa para planejar, colaborar,
            organizar informações e acompanhar resultados sem sair de uma única
            plataforma. Menos ferramentas espalhadas, mais produtividade,
            clareza e controle do início ao fim.
          </p>
        </div>
        <div data-reveal style={{ margin: "40px auto 0", maxWidth: 1600 }}>
          <VideoBlock />
        </div>
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
            gap: 18,
          }}
        >
          {CAPABILITIES.map((card) => (
            <div
              key={card.title.join(" ")}
              data-reveal
              style={{
                background: "linear-gradient(180deg,#0e0e11,#08080a)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "1.5px solid #3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b82f6",
                  fontSize: 11,
                }}
              >
                ✓
              </div>
              <h3
                style={{
                  margin: "18px 0 10px",
                  fontSize: 18,
                  fontWeight: 800,
                  lineHeight: 1.25,
                  letterSpacing: "-.01em",
                }}
              >
                {card.title[0]}
                <br />
                {card.title[1]}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "#9a9aa1",
                }}
              >
                {card.text}
              </p>
            </div>
          ))}
        </div>
        <div data-reveal style={{ textAlign: "center", marginTop: 64 }}>
          <a
            href="/cadastro"
            className="lp-btn-white"
            style={{
              display: "inline-block",
              fontSize: 15,
              fontWeight: 700,
              padding: "14px 30px",
              borderRadius: 10,
            }}
          >
            Começar agora
          </a>
        </div>
      </section>

      {/* Evolução ------------------------------------------------------ */}
      <section id="evolucao" style={{ padding: "130px 24px 0" }}>
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 40,
            flexWrap: "wrap",
          }}
        >
          <h2
            data-reveal
            style={{
              margin: 0,
              fontSize: "clamp(28px,3.4vw,46px)",
              lineHeight: 1.12,
              letterSpacing: "-.03em",
              fontWeight: 800,
              maxWidth: "16ch",
            }}
          >
            Uma plataforma feita para evoluir junto com sua equipe.
          </h2>
          <Asset
            src="/assets/teronwhite.svg"
            alt=""
            ratio="595 / 550"
            style={{ width: 118, height: "auto", display: "block" }}
          />
        </div>
        <ul className="lp-prod-grid">
          <RiveCard
            src="/animations/hotkeys.riv"
            title="Atalhos de teclado."
            text="Trabalhe com eficiência e acesso instantâneo às ações mais comuns."
          />
          <RiveCard
            src="/animations/team-planner.riv"
            title="Planner da equipe."
            text="Acompanhe o quadro geral visualizando todas as tarefas individuais em um calendário único da equipe."
            variant="wide"
          />
          <RiveCard
            src="/animations/time-blocking.riv"
            title="Blocos de tempo."
            text="Transforme as tarefas do dia em blocos de tempo estruturados para manter o foco."
            variant="wide"
          />
          <RiveCard
            src="/animations/notifications.riv"
            title="Notificações."
            text="Fique por dentro de cada mudança recebendo notificações instantâneas."
            video="/assets/waves.webm"
          />
        </ul>
      </section>

      <Knowledge />

      <GithubSync />

      {/* CTA final ------------------------------------------------------ */}
      <section id="comecar" className="lp-cta">
        <div className="lp-cta-row">
          <div className="lp-cta-copy" data-reveal>
            <h2 className="lp-cta-title">Junte-se ao movimento</h2>
            <p className="lp-cta-text">
              Centralize o trabalho da sua equipe com a Teron. Essa jornada
              está apenas começando.
            </p>
            <div className="lp-cta-actions">
              <HeroCta href="/cadastro" label="Ver em ação" />
              <a href="mailto:jbmidia@gmail.com" className="lp-btn-pill-dark">
                Falar com o time
              </a>
            </div>
          </div>

          {/* Depois do texto no DOM, como no original: a arte é decorativa e
              absoluta, então a ordem aqui só decide quem o leitor de tela
              encontra primeiro. */}
          <div className="lp-cta-art" aria-hidden>
            <LoopFadeVideo src="/assets/teron.mp4" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
