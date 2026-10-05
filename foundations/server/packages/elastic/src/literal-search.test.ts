import { literalSearchQuery, literalSearchValues } from './literal-search'
describe('literal fulltext search', () => {
  it('normalizes accents/case and escapes wildcard syntax', () => {
    expect(literalSearchQuery('AÇÃO*?\\')).toEqual({ wildcard: { literalSearch: { value: '*acao\\*\\?\\\\*' } } })
    expect(literalSearchQuery('a+b:(c)')).toEqual({ wildcard: { literalSearch: { value: '*a+b:(c)*' } } })
  })
  it('indexes content values without changing original source or indexing binary payloads', () => {
    const doc = { searchTitle: 'Ação', fulltextSummary: 'CAFÉ', attachment: { content: 'Relatório' }, data: 'BASE64', space: 'private', literalSearch: ['old'] }
    expect(literalSearchValues(doc)).toEqual(['acao', 'cafe', 'relatorio'])
    expect(doc.searchTitle).toBe('Ação')
    expect(literalSearchValues({ ...doc, literalSearch: literalSearchValues(doc) })).toEqual(literalSearchValues(doc))
  })
})
