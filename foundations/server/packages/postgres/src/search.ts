// CockroachDB has translate/regexp_replace, but does not implement PostgreSQL normalize().
// Build canonical single-character accent folds without changing stored text.
let accented = ''
let folded = ''
for (let point = 0; point <= 0x2fff; point++) {
  const char = String.fromCodePoint(point)
  const normalized = char.normalize('NFD').replace(/\p{M}/gu, '')
  if (normalized.length === 1 && normalized !== char) {
    accented += char
    folded += normalized
  }
}

/** SQL expression for literal, case/accent-insensitive substring comparisons. */
export function normalizeSearchSql (expression: string): string {
  return `lower(regexp_replace(translate(${expression}, '${accented}', '${folded}'), '[̀-ͯ]', '', 'g'))`
}
