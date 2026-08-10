import { Asset } from "@/components/landing/asset";
import { Bento } from "@/components/landing/bento";
import { Faq } from "@/components/landing/faq";
import { LogosMarquee } from "@/components/landing/logos-marquee";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { SiteHeader } from "@/components/landing/site-header";
import { SocialIcons } from "@/components/landing/social-icons";

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
            src="/assets/Mask group.svg"
            alt=""
            ratio="1449 / 731"
            className="lp-hero-shot"
          />
          <div aria-hidden className="lp-hero-fade" />
          <Asset
            src="/assets/Grid.svg"
            alt="Dribbble, LEGORA, Zapier, Perplexity, Cal.com, Mixpanel, Miro e DoorDash"
            ratio="600 / 136"
            className="lp-hero-logos"
          />
        </div>
        <div className="lp-hero-copy">
          <h1
            data-reveal
            style={{
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: "-.035em",
              fontWeight: 800,
              maxWidth: "30ch",
              textWrap: "balance",
            }}
          >
            Tudo o que sua equipe precisa. Em um só lugar.
          </h1>
          <p
            data-reveal
            style={{
              margin: "16px 0 0",
              lineHeight: 1.5,
              color: "#a7a7ad",
              maxWidth: "62ch",
            }}
          >
            Pare de alternar entre dezenas de ferramentas. Centralize projetos,
            tarefas, reuniões e comunicação em uma única plataforma para sua
            equipe produzir mais.
          </p>
          <div
            data-reveal
            style={{
              marginTop: 22,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <a
              href="/login/signup"
              className="lp-btn-white"
              style={{ fontWeight: 700, borderRadius: 9 }}
            >
              Começar agora
            </a>
            <a
              href="#plataforma"
              className="lp-btn-ghost"
              style={{ fontWeight: 600, borderRadius: 9 }}
            >
              Saiba Mais
            </a>
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
          <Asset
            src="/assets/video-block.png"
            alt=""
            ratio="21 / 9"
            style={{ width: "100%", display: "block" }}
          />
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
            href="/login/signup"
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
      <section style={{ padding: "130px 24px 0" }}>
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
            src="/assets/logo-mark.png"
            alt=""
            ratio="1 / 1"
            style={{ width: 118, height: "auto", display: "block" }}
          />
        </div>
        <div data-reveal style={{ maxWidth: 1330, margin: "56px auto 0" }}>
          <Asset
            src="/assets/evo-1.png"
            alt=""
            ratio="21 / 9"
            style={{ width: "100%", display: "block" }}
          />
        </div>
        <div
          style={{
            maxWidth: 1330,
            margin: "34px auto 0",
            display: "flex",
            gap: 30,
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div data-reveal style={{ flex: "1 1 420px", minWidth: 0 }}>
            <Asset
              src="/assets/evo-2.png"
              alt=""
              ratio="16 / 9"
              style={{ width: "100%", display: "block" }}
            />
          </div>
          <div data-reveal style={{ width: 300, maxWidth: "60%" }}>
            <Asset
              src="/assets/orb.png"
              alt=""
              ratio="1 / 1"
              style={{ width: "100%", display: "block" }}
            />
          </div>
        </div>
      </section>

      {/* Clientes ------------------------------------------------------ */}
      <section id="clientes" style={{ padding: "110px 24px 0" }}>
        <p
          data-reveal
          style={{
            textAlign: "center",
            margin: "0 0 30px",
            fontSize: 12,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "#6f6f77",
            fontWeight: 700,
          }}
        >
          Empresas que já usam
        </p>
        <div data-reveal style={{ maxWidth: 1720, margin: "0 auto" }}>
          <LogosMarquee />
        </div>
      </section>

      <Faq />

      {/* CTA final ------------------------------------------------------ */}
      <section id="comecar" style={{ position: "relative", marginTop: 120 }}>
        <div className="lp-cta-art">
          <Asset src="/assets/watch.png" alt="" ratio="2.79 / 1" />
          {/* Esfuma as bordas da arte contra o fundo preto da página. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              boxShadow: "inset 0 0 160px 90px #000",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(to right,#000 0%,transparent 18%,transparent 82%,#000 100%)," +
                "linear-gradient(to bottom,#000 0%,transparent 20%,transparent 80%,#000 100%)",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1240,
              margin: "0 auto",
              padding: "0 24px",
            }}
          >
            <div className="lp-cta-copy" data-reveal>
              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(32px,4.4vw,58px)",
                  lineHeight: 1.05,
                  letterSpacing: "-.035em",
                  fontWeight: 800,
                }}
              >
                Junte-se ao movimento
              </h2>
              <p
                style={{
                  margin: "16px 0 0",
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "#a7a7ad",
                }}
              >
                Centralize o trabalho da sua equipe com a Huly. Essa jornada
                está apenas começando.
              </p>
              <div
                className="lp-cta-actions"
                style={{
                  marginTop: 26,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <a
                  href="#plataforma"
                  className="lp-btn-white"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "12px 24px",
                    borderRadius: 999,
                  }}
                >
                  Ver em ação
                </a>
                <a
                  href="#faq"
                  className="lp-btn-ghost"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "12px 24px",
                    borderRadius: 999,
                  }}
                >
                  Falar com o time
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: "40px 24px 40px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Asset
              src="/assets/logo-footer.png"
              alt="huly"
              ratio="4 / 1"
              style={{
                height: 44,
                width: "auto",
                display: "inline-block",
              }}
            />
          </div>
          <div className="lp-footer-bar">
            <span>© {new Date().getFullYear()} Huly Labs. Todos os direitos reservados.</span>
            <span style={{ display: "flex", gap: 26 }}>
              <a href="#faq" className="lp-footer-link">
                Termos de Serviço
              </a>
              <a href="#faq" className="lp-footer-link">
                Política de Privacidade
              </a>
            </span>
            <SocialIcons />
            <span>Feito com paixão e Huly</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
