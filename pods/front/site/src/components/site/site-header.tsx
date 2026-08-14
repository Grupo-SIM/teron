"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { DocumentLocale } from "@/i18n/document-locale";
import { Localized, defaultLocale, type Locale } from "@/i18n/site";
import { Asset } from "./asset";

type SiteSession =
  | { authenticated: false }
  | { authenticated: true; workspaceHref: string };

/*
 * Uma entrada por seção da página, na ordem em que elas aparecem — o topo serve
 * de índice, e link que pula para trás confunde quem está lendo de cima a
 * baixo. O menu do celular repete a mesma lista para não haver duas versões do
 * que a página tem.
 *
 * As âncoras levam a raiz junto (`/#...`) porque o cabeçalho também aparece em
 * `/precos`: sem o caminho o link cairia numa seção que não existe ali. Na
 * própria home o navegador trata `/#x` como salto na mesma página, então a
 * rolagem suave continua valendo.
 */
const LINKS = [
  { href: "/#plataforma", label: "Plataforma" },
  { href: "/#operacao", label: "Operação" },
  { href: "/#conhecimento", label: "Conhecimento" },
  { href: "/#github", label: "GitHub" },
  { href: "/precos", label: "Preços" },
];

export function SiteHeader({ locale = defaultLocale }: { locale?: Locale }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<SiteSession | null>(null);
  const pathname = usePathname();
  const nextLocale: Locale = locale === "pt-BR" ? "en-US" : "pt-BR";
  const languageHref =
    nextLocale === "en-US"
      ? `/en-US${pathname === "/" ? "" : pathname}`
      : pathname.replace(/^\/en-US(?=\/|$)/, "") || "/";

  const switchLanguage = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const url = new URL(window.location.href);
    url.pathname = languageHref;
    window.location.assign(url.toString());
  };

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/v1/site/session", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load the site session");
        return (await response.json()) as SiteSession;
      })
      .then(setSession)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSession({ authenticated: false });
      });

    return () => controller.abort();
  }, []);

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
    <Localized locale={locale}><><DocumentLocale locale={locale} /><header
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
        <Link href="/" aria-label="Teron — início" style={{ display: "block" }}>
          <Asset
            src="/assets/teronwhite.svg"
            alt="Teron"
            ratio="595 / 550"
            style={{ height: 30, width: "auto", display: "block" }}
          />
        </Link>
        <nav
          className="lp-desktop-only"
          style={{ gap: 26, fontSize: 14, fontWeight: 500 }}
        >
          {LINKS.map((link) => (
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
          <a href={languageHref} onClick={switchLanguage} className="lp-link-plain" style={{ fontSize: 13 }}>
            {nextLocale}
          </a>
          {session?.authenticated ? (
            <WorkspaceLink href={session.workspaceHref} />
          ) : session === null ? null : (
            <>
              <a
                href="/entrar"
                className="lp-link-plain"
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                Entrar
              </a>
              <a
                href="/cadastro"
                className="lp-btn-white"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "8px 16px",
                  borderRadius: 8,
                }}
              >
                Cadastre-se
              </a>
            </>
          )}
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
            <Link
              href="/"
              aria-label="Teron — início"
              onClick={() => setMenuOpen(false)}
              style={{ display: "block" }}
            >
              <Asset
                src="/assets/teronwhite.svg"
                alt="Teron"
                ratio="595 / 550"
                style={{ height: 30, width: "auto", display: "block" }}
              />
            </Link>
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
            {LINKS.map((link) => (
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
            <a href={languageHref} onClick={switchLanguage} className="lp-menu-btn">
              {nextLocale}
            </a>
            {session?.authenticated ? (
              <a
                href={session.workspaceHref}
                onClick={() => setMenuOpen(false)}
                className="lp-menu-btn"
              >
                Ir para o workspace
              </a>
            ) : session === null ? null : (
              <>
                <a
                  href="/entrar"
                  onClick={() => setMenuOpen(false)}
                  className="lp-menu-btn"
                >
                  Entrar
                </a>
                <a
                  href="/cadastro"
                  onClick={() => setMenuOpen(false)}
                  className="lp-menu-btn"
                >
                  Começar agora
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header></></Localized>
  );
}

function WorkspaceLink({ href, locale = defaultLocale }: { href: string; locale?: Locale }) {
  return (
    <Localized locale={locale}><a
      href={href}
      className="lp-btn-white"
      style={{
        fontSize: 14,
        fontWeight: 700,
        padding: "8px 16px",
        borderRadius: 8,
      }}
    >
      Ir para o workspace
    </a></Localized>
  );
}
