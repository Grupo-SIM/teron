import core, { type Doc, type MeasureContext, type SessionData, type Tx, type TxUpdateDoc } from '@hcengineering/core'
import task from '@hcengineering/task'
import tracker from '@hcengineering/tracker'
import { type Middleware, type PipelineContext } from '@hcengineering/server-core'
import { normalizeAssignmentData, TaskAssigneesMiddleware } from './TaskAssigneesMiddleware'

function fixture (): { middleware: TaskAssigneesMiddleware, forwarded: jest.Mock } {
  const forwarded = jest.fn(async () => [])
  const next = { tx: forwarded, findAll: async () => [{ _id: 'task', assignees: ['old'], assignee: 'legacy' }] } as unknown as Middleware
  const context = { head: next, hierarchy: { isDerived: (a: string, b: string) => a === b } } as unknown as PipelineContext
  return { middleware: new TaskAssigneesMiddleware(context, next), forwarded }
}
const ctx = {} as MeasureContext<SessionData>
const update = (operations: object): TxUpdateDoc<Doc> => ({ _class: core.class.TxUpdateDoc, objectClass: task.class.Task, objectId: 'task', operations }) as TxUpdateDoc<Doc>

describe('assignment persistence compatibility', () => {
  it('normalizes templates recursively and remains repeatable', () => {
    const value = { assignee: 'one', children: [{ assignee: null }, { assignees: ['two', 'two'] }] }
    const normalized = normalizeAssignmentData(value)
    expect(normalized).toEqual({ assignees: ['one'], children: [{ assignees: [] }, { assignees: ['two'] }] })
    expect(normalizeAssignmentData(normalized)).toEqual(normalized)
    expect(() => normalizeAssignmentData({ assignees: 'bad' })).toThrow()
  })
  it('rewrites legacy direct and operator updates to a unique list', async () => {
    for (const operations of [{ assignee: 'new' }, { $set: { assignee: 'new' } }, { assignees: ['new', 'new'] }]) {
      const { middleware } = fixture()
      const tx = update(operations)
      await middleware.tx(ctx, [tx])
      expect(tx.operations).toEqual({ assignees: ['new'], $unset: { assignee: true } })
    }
  })
  it('supports clearing and array additions without duplicate people', async () => {
    const cases: Array<[object, string[]]> = [[{ $unset: { assignees: true } }, []], [{ $push: { assignees: 'old' } }, ['old']]]
    for (const [operations, expected] of cases) {
      const { middleware } = fixture()
      const tx = update(operations)
      await middleware.tx(ctx, [tx])
      expect((tx.operations as any).assignees).toEqual(expected)
    }
  })
  it('normalizes nested creates before forwarding the original batch', async () => {
    const { middleware, forwarded } = fixture()
    const create = { _class: core.class.TxCreateDoc, objectClass: tracker.class.IssueTemplate, attributes: { assignee: 'one', children: [{ assignee: 'two' }] } }
    const batch = [{ _class: core.class.TxApplyIf, txes: [create] }] as unknown as Tx[]
    await middleware.tx(ctx, batch)
    expect(create.attributes).toEqual({ assignees: ['one'], children: [{ assignees: ['two'] }] })
    expect(forwarded).toHaveBeenCalledWith(ctx, batch)
  })
})
