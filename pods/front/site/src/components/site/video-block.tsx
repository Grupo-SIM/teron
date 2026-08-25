"use client";

import { useEffect, useRef, useState } from "react";
import { Localized, defaultLocale, type Locale } from "@/i18n/site";

/**
 * Bloco do escritório virtual: a arte de fundo (`video-block.png`) com a
 * chamada de vídeo rodando por cima.
 *
 * O painel desenhado no PNG tem proporção 1.553 e o vídeo é 16:9, então em vez
 * de encaixar o vídeo no painel antigo — o que cortaria as miniaturas da
 * direita — desenhamos um painel novo em 16:9 com a mesma altura, largo o
 * bastante para cobrir o que estava queimado na arte. Cabeçalho e controles
 * eram parte da imagem e voltam aqui como HTML.
 */
export function VideoBlock({ locale = defaultLocale }: { locale?: Locale }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  // São ~7 MB de vídeo: só baixa quando o bloco chega perto da viewport.
  useEffect(() => {
    const host = hostRef.current;
    if (host == null) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(host);

    return () => io.disconnect();
  }, []);

  return (
    <Localized locale={locale}><div className="lp-office" ref={hostRef}>
      {/* eslint-disable-next-line @next/next/no-img-element -- arte solta em public */}
      <img className="lp-office-plate" src="/assets/video-block.png" alt="" />

      <video
        className="lp-office-glow"
        src="/assets/wt-glow.webm"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />

      <div className="lp-office-screen">
        {load && (
          <video
            className="lp-office-video"
            src="/assets/call.mp4"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
        )}

        <div className="lp-office-head">
          <strong>{"meeting.title"}</strong>
          <span>{"meeting.participants"}</span>
        </div>

        <div className="lp-office-controls" aria-hidden>
          <span className="lp-office-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="5" width="18" height="13" rx="2" />
              <path d="M12 15V9m0 0-2.5 2.5M12 9l2.5 2.5" />
            </svg>
          </span>
          <span className="lp-office-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3 3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              <path d="m4 3 16 18" />
            </svg>
          </span>
          <span className="lp-office-btn lp-office-btn-end">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </span>
          <span className="lp-office-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="6" width="14" height="12" rx="2" />
              <path d="m16 11 6-4v10l-6-4" />
              <path d="m3 3 18 18" />
            </svg>
          </span>
          <span className="lp-office-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 20H4v-5M15 4h5v5" />
              <path d="M4 20 10 14M20 4l-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </div></Localized>
  );
}
