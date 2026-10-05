import activity, { type DocUpdateMessage } from '@hcengineering/activity'
import core, { type Ref, SortingOrder } from '@hcengineering/core'

jest.mock('@hcengineering/presentation', () => ({
  getClient: () => ({ getHierarchy: () => ({ isDerived: () => false }) })
}))
jest.mock('@hcengineering/view-resources', () => ({}))

Object.defineProperty(globalThis, 'localStorage', {
  value: { getItem: () => '10000' },
  configurable: true
})

const { combineActivityMessages } = require('./activityMessagesUtils') as typeof import('./activityMessagesUtils')

function edit (id: string, value: string, prevValue: string, time: number): DocUpdateMessage {
  return {
    _id: id as Ref<DocUpdateMessage>,
    _class: activity.class.DocUpdateMessage,
    space: core.space.Workspace,
    attachedTo: 'project' as DocUpdateMessage['attachedTo'],
    attachedToClass: core.class.Doc,
    objectId: 'project' as DocUpdateMessage['objectId'],
    objectClass: core.class.Doc,
    collection: 'docUpdateMessages',
    txId: id as DocUpdateMessage['txId'],
    createdBy: 'author' as DocUpdateMessage['createdBy'],
    modifiedBy: 'author' as DocUpdateMessage['modifiedBy'],
    createdOn: time,
    modifiedOn: time,
    action: 'update',
    attributeUpdates: {
      attrKey: 'title',
      attrClass: core.class.TypeString,
      isMixin: false,
      prevValue,
      set: [value],
      added: [],
      removed: []
    }
  }
}

describe('activity edit history', () => {
  const edits = [edit('first', 'A', 'Original', 1000), edit('second', 'B', 'A', 2000), edit('third', '123', 'B', 3000)]

  it('keeps consecutive edits to the same field with their original values and timestamps', () => {
    expect(combineActivityMessages(edits)).toEqual(edits)
  })

  it('keeps edits made immediately after creation', () => {
    const creation = { ...edit('creation', 'Original', '', 0), action: 'create' as const }
    expect(combineActivityMessages([creation, ...edits])).toEqual([creation, ...edits])
  })

  it('keeps history when a later edit restores the original value', () => {
    const restore = edit('restore', 'Original', '123', 4000)
    expect(combineActivityMessages([...edits, restore])).toEqual([...edits, restore])
  })

  it('preserves every edit in descending order too', () => {
    expect(combineActivityMessages(edits, SortingOrder.Descending)).toEqual([...edits].reverse())
  })
})
