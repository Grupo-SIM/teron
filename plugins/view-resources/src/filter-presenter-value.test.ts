import { getFilterPresenterValue } from './filter-presenter-value'

describe('filter presenter values', () => {
  it('passes scalar person IDs rather than selection tuples to avatar queries', () => {
    expect(getFilterPresenterValue([
      ['PERSON-A', ['person-a']],
      ['PERSON-B', ['person-b', 'person-c']]
    ], true)).toEqual(['person-a', 'person-b', 'person-c'])
  })

  it('deduplicates grouped IDs and handles empty selections', () => {
    expect(getFilterPresenterValue([['A', ['a']], ['A', ['a', 'b']]], true)).toEqual(['a', 'b'])
    expect(getFilterPresenterValue([], true)).toEqual([])
  })

  it('preserves values for object and date filters', () => {
    const value = ['person-a', null]
    expect(getFilterPresenterValue(value, false)).toBe(value)
  })
})
