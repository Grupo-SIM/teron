import { type Doc, type TxOperations } from '@hcengineering/core'
import tags, { type TagElement } from '@hcengineering/tags'
import { addTagReference } from './add-tag-reference'

describe('tag reference assignment', () => {
  const object = { _id: 'person', _class: 'person-class', space: 'contacts' } as Doc
  const tag = { _id: 'role', title: 'Developer', color: 1 } as TagElement

  it('uses a shared scope and rejects simultaneous or repeated assignments', async () => {
    const records: Array<Record<string, unknown>> = []
    const scopes: string[] = []
    const client = {
      apply: (scope: string) => {
        scopes.push(scope)
        let query: Record<string, unknown>
        let record: Record<string, unknown>
        return {
          notMatch: (_class: unknown, value: Record<string, unknown>) => {
            expect(_class).toBe(tags.class.TagReference)
            query = value
          },
          addCollection: async (_class: unknown, space: unknown, attachedTo: unknown, attachedToClass: unknown, collection: unknown, data: Record<string, unknown>) => {
            record = { space, attachedTo, attachedToClass, collection, ...data }
          },
          commit: async () => {
            if (records.some((item) => Object.entries(query).every(([key, value]) => item[key] === value))) {
              return { result: false }
            }
            records.push(record)
            return { result: true }
          }
        }
      }
    } as unknown as TxOperations
    const assign = (doc = object, collection = 'roles', role = tag) =>
      addTagReference(client, doc, doc._class, collection, role)

    expect(await Promise.all([assign(), assign()])).toEqual([true, false])
    expect(await assign()).toBe(false)
    expect(records).toHaveLength(1)
    expect(new Set(scopes)).toEqual(new Set([`tag-reference:${object._id}`]))
    expect(await assign(object, 'labels')).toBe(true)
    expect(await assign({ ...object, _id: 'other-person' as Doc['_id'] })).toBe(true)
    expect(await assign(object, 'roles', { ...tag, _id: 'other-role' as TagElement['_id'] })).toBe(true)
    expect(records).toHaveLength(4)
  })
})
