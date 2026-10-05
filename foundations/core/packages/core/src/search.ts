/** Normalize search text without changing stored or displayed content. */
export function normalizeSearch (value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function containsSearch (value: unknown, query: string): boolean {
  return typeof value === 'string' && normalizeSearch(value).includes(normalizeSearch(query))
}

let variants: Map<string, Set<string>> | undefined

/** Literal Mongo/PCRE substring pattern, including canonical accent variants. */
export function searchLiteralPattern (query: string): string {
  if (variants === undefined) {
    variants = new Map()
    for (let point = 0; point <= 0x2fff; point++) {
      const char = String.fromCodePoint(point)
      const folded = normalizeSearch(char)
      if (folded.length !== 1 || char === folded || /\p{M}/u.test(char)) continue
      const set = variants.get(folded) ?? new Set<string>()
      set.add(char)
      variants.set(folded, set)
    }
  }
  const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return [...normalizeSearch(query)].map((char) => {
    const chars = variants?.get(char)
    const literal = chars === undefined ? escape(char) : `(?:${[char, ...chars].map(escape).join('|')})`
    return literal + '\\p{M}*'
  }).join('')
}
