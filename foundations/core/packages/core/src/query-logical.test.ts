import { matchQuery } from './query'
import type { Doc, Hierarchy, Ref, Class } from './index'
const clazz = 'test:class:Doc' as Ref<Class<Doc>>
const hierarchy = { getBaseClass: () => clazz, isDerived: () => true, findAttribute: () => undefined } as unknown as Hierarchy
const rows = [ { _id: 'one', _class: clazz, name: 'Café', space: 'allowed' }, { _id: 'two', _class: clazz, name: 'Coffee', space: 'allowed' }, { _id: 'private', _class: clazz, name: 'Café', space: 'hidden' } ] as unknown as Doc[]
describe('logical document predicates', () => {
  it('intersects security with nested alternatives without duplicates or order changes', () => {
    expect(matchQuery(rows, { $and: [{ space: 'allowed' }, { $or: [{ name: 'Café' }, { name: 'Café' }] }] }, clazz, hierarchy).map((row) => row._id)).toEqual(['one'])
    expect(matchQuery(rows, { $or: [{ _id: 'two' }, { _id: 'one' }] }, clazz, hierarchy).map((row) => row._id)).toEqual(['one', 'two'])
  })
  it('keeps correct empty identities and refuses malformed clauses', () => {
    expect(matchQuery(rows, { $and: [] }, clazz, hierarchy)).toEqual(rows)
    expect(matchQuery(rows, { $or: [] }, clazz, hierarchy)).toEqual([])
    expect(() => matchQuery(rows, { $or: 'invalid' } as any, clazz, hierarchy)).toThrow('Invalid logical query')
  })
})
