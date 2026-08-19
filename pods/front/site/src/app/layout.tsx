import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Teron",
  title: "Teron — Tudo o que sua equipe precisa para trabalhar melhor.",
  description:
    "Sua empresa mais organizada, sua equipe mais produtiva. Organize seu time, centralize o trabalho e simplifique a rotina da sua empresa.",
  manifest: "/teron/site.webmanifest",
  icons: {
    icon: [
      { url: "/teron/favicon.svg", type: "image/svg+xml" },
      { url: "/teron/favicon.ico", sizes: "any" },
    ],
    shortcut: "/teron/favicon.ico",
    apple: "/teron/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
