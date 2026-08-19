import { Asset } from "@/components/site/asset";
import { Bento } from "@/components/site/bento";
import { GithubSync } from "@/components/site/github-sync";
import { HeroCta } from "@/components/site/hero-cta";
import { Knowledge } from "@/components/site/knowledge";
import { LoopFadeVideo } from "@/components/site/loop-fade-video";
import { RevealObserver } from "@/components/site/reveal-observer";
import { RiveCard } from "@/components/site/rive-card";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { VideoBlock } from "@/components/site/video-block";
import { Localized, defaultLocale, type Locale } from "@/i18n/site";

/*
 * Os títulos vêm em duas partes porque cada card escreve a segunda numa linha
 * própria. Título de uma palavra só deixa a segunda vazia: a linha continua
 * ali e os três cards mantêm a mesma altura de texto.
 */
const PROBLEMS = [
  {
    icon: "/assets/icon-mail.png",
    title: ["Comunicação", ""],
    text: "Mantenha sua equipe conectada, compartilhe informações e acompanhe tudo o que acontece em um único ambiente.",
  },
  {
    icon: "/assets/icon-chat.png",
    title: ["Organização", ""],
    text: "Gerencie projetos, arquivos e documentos. Distribua tarefas, acompanhe prazos e saiba exatamente o que precisa ser feito.",
  },
  {
    icon: "/assets/icon-person.png",
    title: ["Gestão", "da equipe"],
    text: "Tenha uma visão clara do que está acontecendo, quem está responsável por cada tarefa e como os projetos estão avançando.",
  },
];

const CAPABILITIES = [
  {
    title: ["Personalize", "seu espaço"],
    text: "Adapte a plataforma à forma como sua equipe trabalha.",
  },
  {
    title: ["Simples", "de usar"],
    text: "Uma experiência intuitiva para sua equipe começar a trabalhar sem complicação.",
  },
  {
    title: ["Para empresas de", "todos os setores"],
    text: "Ferramentas para organizar equipes, projetos e processos em diferentes segmentos.",
  },
  {
    title: ["Cresça com", "sua equipe"],
    text: "Uma plataforma preparada para acompanhar sua empresa em cada etapa do crescimento.",
  },
];

export function HomeContent({ locale = defaultLocale }: { locale?: Locale }) {
  return (
    <Localized locale={locale}><div
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
              Tudo o que sua equipe precisa para trabalhar melhor.
            </h1>
            <p
              data-reveal
              style={{
                marginBottom: 0,
                color: "#a7a7ad",
              }}
            >
              Sua empresa mais organizada, sua equipe mais produtiva. Organize
              seu time, centralize o trabalho e simplifique a rotina da sua
              empresa.
            </p>
            <div data-reveal className="lp-hero-cta">
              <HeroCta label="Começar gratuitamente" />
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
            Um novo jeito de trabalhar em equipe
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
            Uma plataforma completa para conectar pessoas, organizar o trabalho
            e manter sua empresa em movimento. Tudo integrado para sua equipe
            trabalhar de forma mais simples e eficiente.
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
            Feito para o trabalho do dia a dia
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
            Sua equipe, conectada de qualquer lugar
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
            Tenha seu próprio escritório digital, além de salas de reuniões
            para fazer videochamadas e reunir sua equipe a qualquer momento.
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
            Muito mais do que gerenciar projetos. Um espaço completo para toda
            a sua operação.
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
            text="Trabalhe com mais agilidade e acesse rapidamente as ações mais utilizadas."
          />
          <RiveCard
            src="/animations/team-planner.riv"
            title="Espaços e fluxos de trabalho."
            text="Crie ambientes separados para equipes, projetos ou departamentos."
            variant="wide"
          />
          <RiveCard
            src="/animations/time-blocking.riv"
            title="Atualizações em tempo real."
            text="Veja alterações e movimentações da equipe instantaneamente. Visualize compromissos, tarefas e eventos em um só lugar."
            variant="wide"
          />
          <RiveCard
            src="/animations/notifications.riv"
            title="Notificações inteligentes."
            text="Receba apenas as atualizações importantes para você."
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
              Centralize o trabalho da sua equipe com o Teron. Essa jornada
              está apenas começando.
            </p>
            <div className="lp-cta-actions">
              {/* O botão de cadastro subiu para o fim da seção de integrações:
                  quem chega aqui já passou por ele. Sobra o contato direto. */}
              <a
                href="https://wa.me/556892078221"
                className="lp-btn-pill-dark"
                target="_blank"
                rel="noreferrer"
              >
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
    </div></Localized>
  );
}

export default function Home() {
  return <HomeContent />;
}
