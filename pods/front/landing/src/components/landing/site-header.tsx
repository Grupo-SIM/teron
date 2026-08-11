"use client";

import { useEffect, useState } from "react";
import { Asset } from "./asset";

const DESKTOP_LINKS = [
  { href: "#plataforma", label: "Solutions" },
  { href: "#plataforma", label: "Platform" },
  { href: "#clientes", label: "Community" },
  { href: "#faq", label: "Resources" },
  { href: "#operacao", label: "Enterprise" },
  { href: "#comecar", label: "Pricing" },
];

const MOBILE_LINKS = [
  { href: "#plataforma", label: "Plataforma" },
  { href: "#operacao", label: "Operação" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  // menu em tela cheia: trava o scroll do fundo e fecha no Esc
  useEffect(() => {
    if (!menuOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "transparent",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 34,
        }}
      >
        <Asset
          src="/assets/teronwhite.svg"
          alt="Teron"
          ratio="595 / 550"
          style={{ height: 30, width: "auto", display: "block" }}
        />
        <nav
          className="lp-desktop-only"
          style={{ gap: 26, fontSize: 14, fontWeight: 500 }}
        >
          {DESKTOP_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="lp-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div
          className="lp-desktop-only"
          style={{ alignItems: "center", gap: 18 }}
        >
          <a
            href="#comecar"
            className="lp-link-plain"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            Log in
          </a>
          <a
            href="#comecar"
            className="lp-btn-white"
            style={{
              fontSize: 14,
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: 8,
            }}
          >
            Sign up
          </a>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          className="lp-burger"
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,.16)",
            borderRadius: 8,
            width: 38,
            height: 38,
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="lp-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="lp-menu-top">
            <Asset
              src="/assets/teronwhite.svg"
              alt="Teron"
              ratio="595 / 550"
              style={{ height: 30, width: "auto", display: "block" }}
            />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
              className="lp-menu-close"
            >
              ✕
            </button>
          </div>

          <nav className="lp-menu-links">
            {MOBILE_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="lp-menu-link"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="lp-menu-actions">
            <a
              href="#comecar"
              onClick={() => setMenuOpen(false)}
              className="lp-menu-btn"
            >
              Entrar
            </a>
            <a
              href="#comecar"
              onClick={() => setMenuOpen(false)}
              className="lp-menu-btn"
            >
              Começar agora
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
