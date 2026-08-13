"use client";

import { useState, type CSSProperties } from "react";

type AssetProps = {
  /** Caminho dentro de `public`, ex.: `/assets/hero-shot.png`. */
  src: string;
  alt: string;
  style?: CSSProperties;
  className?: string;
  /** Proporção usada pelo placeholder enquanto o arquivo não existe. */
  ratio?: string;
};

/**
 * `<img>` que troca por um placeholder quando o arquivo ainda não foi
 * colocado em `public/assets`, para o layout não quebrar.
 */
export function Asset({ src, alt, style, className, ratio }: AssetProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`lp-asset-fallback${className ? ` ${className}` : ""}`}
        style={{ ...style, aspectRatio: ratio ?? "16 / 9" }}
      >
        {src.replace("/assets/", "")}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- dimensões dos assets ainda desconhecidas
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
