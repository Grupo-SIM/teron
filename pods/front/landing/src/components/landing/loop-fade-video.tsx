"use client";

import { useEffect, useRef } from "react";

type LoopFadeVideoProps = {
  src: string;
  className?: string;
};

/*
 * `loop` sozinho corta pro frame 0 sem aviso — dá pra notar o "salto" mesmo
 * num clipe pensado pra repetir. Em vez disso, a cada frame calculamos a
 * distância até o começo/fim e mergulhamos a opacidade a zero bem perto da
 * virada: como o vídeo já fica sobre fundo preto (e com a vinheta ao redor
 * dele), o mergulho se disfarça de fade em vez de parecer reinício.
 */
export function LoopFadeVideo({ src, className }: LoopFadeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const fade = 0.45; // segundos de mergulho de cada lado da virada
    let raf = 0;

    const tick = () => {
      const { currentTime: t, duration: d } = video;
      if (d > 0 && Number.isFinite(d)) {
        const untilStart = t / fade;
        const untilEnd = (d - t) / fade;
        const opacity = Math.max(0, Math.min(1, untilStart, untilEnd));
        video.style.opacity = String(opacity);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden
    />
  );
}
