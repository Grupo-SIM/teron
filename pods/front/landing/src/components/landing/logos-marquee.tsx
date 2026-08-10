const LOGOS = [
  { src: "spy-hacker.png", alt: "007 Spy Hacker Jacques", size: "xl" },
  { src: "areaflix.png", alt: "ÁreaFlix" },
  { src: "atlas-hosting.png", alt: "Atlas Hosting" },
  { src: "central-marketing.png", alt: "Central do Marketing" },
  { src: "ebooksim.png", alt: "EbookSim" },
  { src: "fraternidade.png", alt: "Fraternidade", size: "sm", dark: true },
  { src: "grana-na-hora.png", alt: "Grana na Hora", size: "xl" },
  { src: "marketing-raiz.png", alt: "Marketing Raiz" },
  { src: "marketplace.png", alt: "Marketplace" },
  { src: "saut.png", alt: "Saut" },
  { src: "lazzu.svg", alt: "Lazzu" },
  { src: "simintpay.svg", alt: "SimintPay" },
  { src: "zyrin.png", alt: "Zyrin Brasil" },
  { src: "jbmidia.png", alt: "JB Mídia", size: "xxl" },
  { src: "bet.png", alt: "Bet", size: "xxl" },
] as const;

function Logo({
  logo,
  hidden,
}: {
  logo: (typeof LOGOS)[number];
  hidden?: boolean;
}) {
  const classes = ["lp-logo"];
  if ("size" in logo && logo.size) classes.push(`lp-logo-${logo.size}`);
  if ("dark" in logo && logo.dark) classes.push("lp-logo-dark");

  return (
    // eslint-disable-next-line @next/next/no-img-element -- logos de tamanhos variados, altura fixada por CSS
    <img
      src={`/assets/logos/${logo.src}`}
      alt={hidden ? "" : logo.alt}
      aria-hidden={hidden}
      className={classes.join(" ")}
    />
  );
}

export function LogosMarquee() {
  return (
    <div className="lp-logos-box">
      <div className="lp-logos-strip">
        <div className="lp-logos-track">
          {LOGOS.map((logo) => (
            <Logo key={logo.src} logo={logo} />
          ))}
          {/* segunda cópia: o loop volta em -50% e emenda sem salto */}
          {LOGOS.map((logo) => (
            <Logo key={`${logo.src}-dup`} logo={logo} hidden />
          ))}
        </div>
      </div>
    </div>
  );
}
