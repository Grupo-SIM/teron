import { matchQuery } from './query'
import type { Doc, Hierarchy, Ref, Class } from './index'
const clazz = 'test:class:Doc' as Ref<Class<Doc>>
const hierarchy = { getBaseClass: () => clazz, isDerived: () => true, findAttribute: () => undefined } as unknown as Hierarchy
const rows = [ { _id: 'one', _class: clazz, name: 'Café', space: 'allowed' }, { _id: 'two', _class: clazz, name: 'Coffee', space: 'allowed' }, { _id: 'private', _class: clazz, name: 'Café', space: 'hidden' } ] as unknown as Doc[]
describe('logical document predicates', () => {
  it('matches partial tag titles and descriptions while preserving class/category filters', () => {
    const tags = [
      { _id: 'group', _class: clazz, title: 'GRUPO SIM', description: '', targetClass: 'task', category: 'labels' },
      { _id: 'description', _class: clazz, title: 'RENOVADA', description: 'Grupo parceiro', targetClass: 'task', category: 'labels' },
      { _id: 'other-class', _class: clazz, title: 'GRUPO SIM', targetClass: 'contact', category: 'labels' },
      { _id: 'other-category', _class: clazz, title: 'GRUPO SIM', targetClass: 'task', category: 'other' }
    ] as unknown as Doc[]
    for (const search of ['gr', 'G', 'rupo', 'SIM']) {
      const result = matchQuery(tags, {
        targetClass: 'task',
        category: 'labels',
        $or: [{ title: { $contains: search } }, { description: { $contains: search } }]
      }, clazz, hierarchy)
      expect(result.map((row) => row._id)).toEqual(search === 'SIM' ? ['group'] : ['group', 'description'])
    }
  })
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
