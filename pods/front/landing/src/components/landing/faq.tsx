"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Quanto tempo leva para implantar a plataforma?",
    a: "A configuração inicial leva poucos minutos. Times pequenos costumam começar no mesmo dia; operações maiores contam com apoio na migração de projetos e documentos.",
  },
  {
    q: "Consigo migrar dados das ferramentas que já uso?",
    a: "Sim. É possível importar projetos, tarefas, documentos e histórico das ferramentas mais comuns do mercado, mantendo responsáveis, prazos e anexos.",
  },
  {
    q: "Como funciona a cobrança?",
    a: "A cobrança é mensal por usuário ativo, com desconto no plano anual. Não há taxa de implantação e o plano pode ser alterado a qualquer momento.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Os dados são criptografados em trânsito e em repouso, com controle de permissões por projeto, registro de auditoria e backups diários.",
  },
  {
    q: "A plataforma funciona no celular?",
    a: "Sim. Tarefas, conversas, documentos e notificações estão disponíveis no navegador móvel e nos aplicativos, com sincronização em tempo real.",
  },
  {
    q: "Existe suporte em português?",
    a: "Sim. O suporte é feito em português por time próprio, com atendimento por chat dentro da plataforma e por e-mail.",
  },
];

export function Faq() {
  // um item por vez, como no acordeão original
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="lp-faq">
      <a href="/login/signup" className="lp-faq-cta">
        Começar agora
      </a>
      <div className="lp-faq-card" data-reveal>
        <h2 className="lp-faq-title">FAQ</h2>
        <div className="lp-faq-panel">
          <div className="lp-acc">
            {FAQS.map((faq, index) => {
              const isOpen = open === index;
              const panelId = `faq-panel-${index}`;

              return (
                <div
                  key={faq.q}
                  className={`lp-acc-item${isOpen ? " is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="lp-acc-q"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span>{faq.q}</span>
                    <span className="lp-acc-pm" aria-hidden>
                      +
                    </span>
                  </button>
                  <div className="lp-acc-a" id={panelId}>
                    <div>
                      <p>{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
