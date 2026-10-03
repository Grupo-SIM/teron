import core, { type Doc, type Hierarchy, type Ref } from '@hcengineering/core'
import document from '@hcengineering/document'
import { findChildDocuments, findTeamspaceDocuments } from './index'
const records = [
  { _id: 'root', _class: document.class.Document, space: 'space', parent: 'none' },
  { _id: 'child', _class: document.class.Document, space: 'space', parent: 'root' },
  { _id: 'snapshot', _class: document.class.DocumentSnapshot, space: 'space', parent: 'root' },
  { _id: 'foreign', _class: document.class.Document, space: 'other', parent: 'root' }
]
const findAll: any = async (clazz: string, query: Record<string, string>) => records.filter((record: any) => record._class === clazz && Object.entries(query).every(([key, value]) => record[key] === value))
describe('guideline deletion boundaries', () => {
  it('collects all documents/versions in the deleted space only', async () => {
    const result = await findTeamspaceDocuments({ _id: 'space', _class: document.class.Teamspace, space: core.space.Space } as Doc, {} as Hierarchy, findAll)
    expect(result.map((doc) => doc._id)).toEqual(['root', 'child', 'snapshot'])
  })
  it('collects descendants and snapshots without following foreign-space parents', async () => {
    const result = await findChildDocuments(records[0] as Doc, {} as Hierarchy, findAll)
    expect(result.map((doc) => doc._id)).toEqual(['child', 'snapshot'])
  })
})
