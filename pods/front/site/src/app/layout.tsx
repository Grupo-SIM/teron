import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Teron",
  title: "Teron — Tudo o que sua equipe precisa. Em um só lugar.",
  description:
    "Centralize projetos, tarefas, reuniões e comunicação em uma única plataforma para sua equipe produzir mais.",
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
