import core, { AccountRole, type Account, type Doc, type Tx } from '@hcengineering/core'
import { changedFields, clientTransactions, isWorkspaceAdministrator, memberTaskUpdateAllowed } from './workspace-policy'

const update = (operations: object): Tx => ({ _class: core.class.TxUpdateDoc, operations }) as Tx
const task = { assignees: ['assigned', 'second'], assignee: 'legacy' } as Doc & { assignees: string[], assignee: string }

describe('workspace member policy', () => {
  it('allows only assigned members to change task status, using the list as source of truth', () => {
    expect(memberTaskUpdateAllowed(update({ status: 'done' }), task, ['second'])).toBe(true)
    expect(memberTaskUpdateAllowed(update({ status: 'done' }), task, ['legacy'])).toBe(false)
    expect(memberTaskUpdateAllowed(update({ description: 'text' }), task, ['other'])).toBe(true)
    expect(memberTaskUpdateAllowed(update({ status: 'done', assignees: ['other'] }), task, ['other'])).toBe(false)
  })
  it('allows accessible task estimates in hours, rejecting invalid or mixed changes', () => {
    for (const estimation of [0, 0.5, 2]) {
      expect(memberTaskUpdateAllowed(update({ estimation }), task, ['other'])).toBe(true)
      expect(memberTaskUpdateAllowed(update({ $set: { estimation } }), task, ['other'])).toBe(true)
    }
    for (const estimation of [-1, NaN, Infinity, '2', null, undefined]) {
      expect(memberTaskUpdateAllowed(update({ estimation }), task, ['other'])).toBe(false)
    }
    expect(memberTaskUpdateAllowed(update({ $unset: { estimation: 1 } }), task, ['other'])).toBe(false)
    expect(memberTaskUpdateAllowed(update({ estimation: 2, dueDate: 0 }), task, ['other'])).toBe(false)
  })
  it('rejects structural, counter and disguised operator changes', () => {
    for (const operations of [{ title: 'x' }, { $unset: { dueDate: 1 } }, { $inc: { comments: 1 } }, { $set: { 'assignees.0': 'x' } }, { $rename: { description: 'title' } }]) {
      expect(memberTaskUpdateAllowed(update(operations), task, ['assigned'])).toBe(false)
    }
    expect(changedFields({ $set: { 'dueDate.value': 0 } })).toEqual(['dueDate'])
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
