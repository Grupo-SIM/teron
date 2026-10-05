import core, { AccountRole, type Account, type Tx } from '@hcengineering/core'
import { changedFields, clientTransactions, isWorkspaceAdministrator } from './workspace-policy'

const update = (operations: object): Tx => ({ _class: core.class.TxUpdateDoc, operations }) as Tx
describe('workspace member policy', () => {
  it('inspects task array operators and dotted identity targets', () => {
    expect(changedFields({ $push: { assignees: 'person' } }, true)).toEqual(['assignees'])
    expect(changedFields({ $inc: { 'space.value': 1 } }, true)).toEqual(['space'])
    expect(changedFields({ $rename: { description: 'space' } }, true)).toEqual(['*'])
    expect(changedFields({ $inc: { comments: 1 } })).toEqual(['*'])
  })
  it('flattens nested batches and refuses unknown transaction kinds', () => {
    const tx = update({ title: 'x' })
    expect(clientTransactions([{ _class: core.class.TxApplyIf, txes: [{ _class: core.class.TxApplyIf, txes: [tx] }] } as unknown as Tx])).toEqual([tx])
    expect(() => clientTransactions([{ _class: core.class.TxWorkspaceEvent } as Tx])).toThrow()
  })
  it('authorizes Owner/Maintainer while keeping members restricted', () => {
    for (const role of [AccountRole.Owner, AccountRole.Maintainer]) expect(isWorkspaceAdministrator({ role } as Account)).toBe(true)
    expect(isWorkspaceAdministrator({ role: AccountRole.User } as Account)).toBe(false)
  })
})
