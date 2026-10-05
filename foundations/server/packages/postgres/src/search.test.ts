import { normalizeSearchSql } from './search'

describe('CockroachDB search normalization', () => {
  const sql = normalizeSearchSql('name')
  const mapping = /translate\(name, '([^']*)', '([^']*)'\)/.exec(sql)!
  const normalize = (value: string): string => [...value].map((char) => {
    const index = mapping[1].indexOf(char)
    return index === -1 ? char : mapping[2][index]
  }).join('').replace(/[̀-ͯ]/g, '').toLowerCase()

  test('uses supported SQL functions, without normalize()', () => {
    expect(sql).not.toContain('normalize(')
    expect(sql.startsWith('lower(regexp_replace(translate(name, ')).toBe(true)
    expect(mapping[1].length).toBe(mapping[2].length)
  })

  test('matches uppercase, composed and decomposed employee names', () => {
    for (const name of ['João', 'JOÃO', 'Joa\u0303o']) expect(normalize(name)).toBe('joao')
    expect(normalize('ÁÉÍÓÚ àèìòù Çç Ññ Üü')).toBe('aeiou aeiou cc nn uu')
  })

  test('preserves literal search punctuation and non-Latin names', () => {
    expect(normalize('100% _ [a] \\ .*')).toBe('100% _ [a] \\ .*')
    expect(normalize('李明')).toBe('李明')
  })
})
