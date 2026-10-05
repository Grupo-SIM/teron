import { type Filter, type KeyFilter } from '@hcengineering/view'
import { normalizeStoredFilters } from './filter-persistence'
import view from './plugin'

jest.mock('./plugin', () => ({
  __esModule: true,
  default: {
    component: { ArrayFilter: 'array-filter' },
    filter: {
      FilterObjectIn: 'object-in',
      FilterObjectNin: 'object-nin',
      FilterArrayAll: 'array-all',
      FilterArrayAny: 'array-any'
    }
  }
}))

const key = { key: 'assignees' } as KeyFilter
const legacy = {
  key: { key: 'assignee' },
  value: ['person-a', 'person-b'],
  mode: view.filter.FilterObjectIn,
  modes: [view.filter.FilterObjectIn],
  index: 1
} as Filter

describe('stored assignee filters', () => {
  it('preserves any-person semantics and creates grouped array selections', () => {
    expect(normalizeStoredFilters([legacy], () => key)).toEqual([{
      ...legacy,
      key,
      value: [['person-a', ['person-a']], ['person-b', ['person-b']]],
      mode: view.filter.FilterArrayAny,
      modes: [view.filter.FilterArrayAll, view.filter.FilterArrayAny, view.filter.FilterObjectNin]
    }])
  })

  it('removes empty legacy selections', () => {
    expect(normalizeStoredFilters([{ ...legacy, value: [] }], () => key)).toEqual([])
  })

  it('migrates exclusion filters and preserves classes without an assignees attribute', () => {
    const exclusion = { ...legacy, mode: view.filter.FilterObjectNin }
    expect(normalizeStoredFilters([exclusion], () => key)[0]).toMatchObject({
      key,
      mode: view.filter.FilterObjectNin,
      value: [['person-a', ['person-a']], ['person-b', ['person-b']]]
    })
    expect(normalizeStoredFilters([legacy], () => undefined)).toEqual([legacy])
  })

  it('repairs uppercase IDs in saved array selections and removes empty filters', () => {
    const currentKey = { ...key, component: view.component.ArrayFilter }
    const current = { ...legacy, key: currentKey, value: [['PERSON-A', ['person-a']]] }
    expect(normalizeStoredFilters([current], () => key)[0].value).toEqual([['person-a', ['person-a']]])
    expect(normalizeStoredFilters([{ ...current, value: [] }], () => key)).toEqual([])
  })
})
