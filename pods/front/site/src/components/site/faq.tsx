"use client";

import { useState } from "react";
import { Localized, defaultLocale, type Locale } from "@/i18n/site";

const FAQS = [
  {
    q: "faq.items.rollout.question",
    a: "faq.items.rollout.answer",
  },
  {
    q: "faq.items.migration.question",
    a: "faq.items.migration.answer",
  },
  {
    q: "faq.items.billing.question",
    a: "faq.items.billing.answer",
  },
  {
    q: "faq.items.security.question",
    a: "faq.items.security.answer",
  },
  {
    q: "faq.items.mobile.question",
    a: "faq.items.mobile.answer",
  },
  {
    q: "faq.items.support.question",
    a: "faq.items.support.answer",
  },
];

export function Faq({ locale = defaultLocale }: { locale?: Locale }) {
  // um item por vez, como no acordeão original
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Localized locale={locale}><section id="faq" className="lp-faq">
      <a href="/cadastro" className="lp-faq-cta">
        {"common.getStarted"}</a>
      <div className="lp-faq-card" data-reveal>
        <h2 className="lp-faq-title">{"faq.title"}</h2>
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
    </section></Localized>
  );
}
