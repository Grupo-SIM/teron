import Link from "next/link";

import { Asset } from "./asset";

/**
 * Rodapé do site. Vive fora da página porque agora é usado também em
 * `/precos`, e duas cópias divergiriam na primeira mudança de link.
 */
export function SiteFooter() {
  return (
    <footer style={{ padding: "40px 24px 40px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Asset
            src="/assets/LOGO TERON  - BRANCA.svg"
            alt="Teron"
            ratio="580 / 134"
            style={{ height: 44, width: "auto", display: "inline-block" }}
          />
        </div>
        <div className="lp-footer-bar">
          <span>
            © {new Date().getFullYear()} Teron. Todos os direitos reservados.
          </span>
          <span style={{ display: "flex", gap: 26 }}>
            <Link href="/termos" className="lp-footer-link">
              Termos de Serviço
            </Link>
            <Link href="/privacidade" className="lp-footer-link">
              Política de Privacidade
            </Link>
          </span>
          <span>Feito com paixão e Teron</span>
        </div>
      </div>
    </footer>
  );
}
