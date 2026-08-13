import { RiveAnim } from "./rive-anim";

type RiveCardProps = {
  /** Caminho do `.riv` dentro de `public`, ex.: `/animations/hotkeys.riv`. */
  src: string;
  /** Texto em destaque no rodapé do card. */
  title: string;
  text: string;
  /** `wide` usa a proporção 768x420 do teron.io; o padrão é 428x420. */
  variant?: "wide" | "narrow";
  /** Vídeo opcional atrás da animação (fundo do card de notificações). */
  video?: string;
};

/** Card da seção "Evolução" com animação Rive. */
export function RiveCard({
  src,
  title,
  text,
  variant = "narrow",
  video,
}: RiveCardProps) {
  return (
    <li className={`lp-prod-card lp-prod-${variant}`} data-reveal>
      {video != null && (
        <video
          className="lp-prod-video"
          src={video}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      )}
      <RiveAnim src={src} className="lp-prod-anim" />
      <p className="lp-prod-txt">
        <strong>{title}</strong> {text}
      </p>
    </li>
  );
}
