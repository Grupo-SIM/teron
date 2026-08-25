import enUS from './locales/en-US.json'
import ptBR from './locales/pt-BR.json'

type TranslationKey = keyof typeof enUS
type TranslationParams = Record<string, string | number>

const dictionaries = {
  en: enUS,
  pt: ptBR
}

export function translateDesktop (
  key: TranslationKey,
  params: TranslationParams = {},
  locale: string = getSystemLocale()
): string {
  const language = locale.toLowerCase().split('-')[0] as keyof typeof dictionaries
  const dictionary = dictionaries[language] ?? dictionaries.en
  const value = dictionary[key] ?? dictionaries.en[key]

  let result: string = value
  for (const [name, replacement] of Object.entries(params)) {
    result = result.replaceAll(`{${name}}`, String(replacement))
  }
  return result
}

function getSystemLocale (): string {
  if (typeof navigator !== 'undefined') return navigator.language
  return Intl.DateTimeFormat().resolvedOptions().locale
}
