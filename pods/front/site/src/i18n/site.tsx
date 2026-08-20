import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { enUS } from "./locales/en-US";
import { ptBR } from "./locales/pt-BR";

export const locales = ["pt-BR", "en-US"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locexport const dictionaries: Readonly<Record<Locale, SiteDictionary>> = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

const localizableProps = new Set([
  "alt",
  "aria-label",
  "cta",
  "intro",
  "label",
  "name",
  "placeholder",
  "q",
  "a",
  "submitLabel",
  "text",
  "title",
  "updatedAt",
]);

function translateText(text: string, locale: Locale): string {
  const value = text.trim();
  if (value === "") return text;
  const translated = dictionaries[locale][value];
  if (translated === undefined) return text;
  return `${text.match(/^\s*/)?.[0] ?? ""}${translated}${text.match(/\s*$/)?.[0] ?? ""}`;
}

function localizedHref(href: string, locale: Locale): string {
  if (locale === "pt-BR" || !href.startsWith("/") || href.startsWith("/en-US")) return href;
  if (/^\/(api|login|workbench|auth)(\/|$)/.test(href)) return href;
  return `/en-US${href}`;
}

export function localizeTree(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === "string") return translateText(node, locale);
  if (Array.isArray(node)) return node.map((child) => localizeTree(child, locale));
  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const props: Record<string, unknown> = { ...element.props };

  for (const [key, value] of Object.entries(props)) {
    if (key === "children") props.children = localizeTree(value as ReactNode, locale);
    else if (key === "href" && typeof value === "string") props.href = localizedHref(value, locale);
    else if (localizableProps.has(key) && typeof value === "string") props[key] = translateText(value, locale);
  }

  if (typeof element.type !== "string") props.locale = locale;
  return cloneElement(element, props);
}

export function Localized({ children, locale }: { children: ReactNode; locale: Locale }) {
  return localizeTree(children, locale);
}

export function pageMetadata(
  locale: Locale,
  portuguese: { title: string; description: string },
  englishCopy: { title: string; description: string },
) {
  return locale === "pt-BR" ? portuguese : englishCopy;
}
