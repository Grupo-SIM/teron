import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { defaultLocale, getDictionary } from "@/i18n/site";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const metadataCopy = getDictionary(defaultLocale).metadata.site;

export const metadata: Metadata = {
  applicationName: "Teron",
  title: metadataCopy.title,
  description: metadataCopy.description,
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
