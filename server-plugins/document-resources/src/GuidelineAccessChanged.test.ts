import core, { type Tx } from '@hcengineering/core'
import document from '@hcengineering/document'
import type { TriggerControl } from '@hcengineering/server-core'
import { GuidelineAccessChanged } from './GuidelineAccessChanged'

const changed = (id: string, operations: object = {}): Tx => ({ _class: core.class.TxUpdateDoc, objectClass: core.class.TypedSpace, objectId: id, operations }) as unknown as Tx
function control (members: string[], sectorMembers: string[], grants: object = {}): TriggerControl {
  const spaces = [{ _id: 'space', _class: document.class.Teamspace, space: core.space.Space, members, private: true, guidelineAccess: true, guidelineReaderSectors: ['sector'], ...grants }]
  return {
    hierarchy: { isDerived: (actual: string, base: string) => actual === base },
    findAll: async (_ctx: unknown, clazz: string) => clazz === document.class.Teamspace ? spaces : [{ _id: 'sector', members: sectorMembers }],
    txFactory: { createTxUpdateDoc: (_class: string, space: string, objectId: string, operations: object) => ({ objectClass: _class, objectId, objectSpace: space, operations }) },
    ctx: {}
  } as unknown as TriggerControl
}
describe('effective guideline membership after persisted transactions', () => {
  it('adds current sector members and sums individual grants without duplicates', async () => {
    const result: any[] = await GuidelineAccessChanged([changed('sector', { $push: { members: 'new' } })], control(['old'], ['old', 'new'], { guidelineEditors: ['new', 'individual'] }))
    expect(result[0].operations.members).toEqual(['new', 'individual', 'old'])
    expect(result[0].objectId).toBe('space')
  })
  it('revokes departing sector members while preserving explicit access', async () => {
    const result: any[] = await GuidelineAccessChanged([changed('sector', { $pull: { members: 'old' } })], control(['old', 'individual'], [], { guidelineReaders: ['individual'] }))
    expect(result[0].operations.members).toEqual(['individual'])
  })
  it('does not emit repeated membership updates or modify private visibility', async () => {
    expect(await GuidelineAccessChanged([changed('sector')], control(['old'], ['old']))).toEqual([])
  })
  it('uses final batch state instead of replaying an earlier grant over a later revocation', async () => {
    const result: any[] = await GuidelineAccessChanged([changed('space', { guidelineReaders: ['user'] }), changed('space', { guidelineReaders: [] })], control(['user'], []))
    expect(result[0].operations).toEqual({ members: [] })
  })
})
