import { containsSearch, normalizeSearch, searchLiteralPattern } from './search'

describe('literal accent-insensitive substring search', () => {
  it('matches beginning, middle and end regardless of case or accents', () => {
    for (const query of ['gr', 'G', 'rupo', 'sim']) {
      expect(containsSearch('GRUPO SIM', query)).toBe(true)
    }
    for (const query of ['acao', 'ÇÃO', 'caf', 'AFE', 'afé']) {
      expect(containsSearch('Ação Café', query)).toBe(true)
    }
    expect(normalizeSearch('Ação')).toBe('acao')
    expect(containsSearch(null, 'acao')).toBe(false)
  })
  it('treats wildcard and regex characters as text', () => {
    expect(containsSearch('A_B 50% [x].*', '50% [x].*')).toBe(true)
    expect(containsSearch('AB 500 xxx', '50% [x].*')).toBe(false)
    expect(containsSearch('ABC', '_')).toBe(false)
  })
  it('builds equivalent escaped patterns for Mongo', () => {
    // JavaScript equivalent of PCRE Unicode combining-mark classes.
    for (const query of ['acao', 'ÇÃO', '[x].*', '50%', 'a_b', 'café']) {
      const regex = new RegExp(searchLiteralPattern(query), 'iu')
      for (const value of ['Ação Café', 'Ação CAFÉ', 'A_B 50% [x].*', '500 xxx']) {
        expect(regex.test(value)).toBe(containsSearch(value, query))
      }
    }
  })
})
