import core, { AccountRole, type Account, type Doc, type MeasureContext, type SessionData, type Tx } from '@hcengineering/core'
import contact from '@hcengineering/contact'
import task from '@hcengineering/task'
import document from '@hcengineering/document'
import calendar from '@hcengineering/calendar'
import attachment from '@hcengineering/attachment'
import time from '@hcengineering/time'
import { type Middleware, type PipelineContext } from '@hcengineering/server-core'
import { WorkspaceAuthorizationMiddleware } from './WorkspaceAuthorizationMiddleware'

const space = 'visible'
const person = 'person'
const user = 'social'
const docs = new Map<string, object>([
  [space, { _id: space, _class: core.class.Space, members: [] }],
  ['readerSpace', { _id: 'readerSpace', _class: core.class.Space, members: ['account'], guidelineAccess: true, guidelineReaders: ['account'] }],
  ['editorSpace', { _id: 'editorSpace', _class: core.class.Space, members: ['account'], guidelineAccess: true, guidelineEditors: ['account'] }],
  ['readerDoc', { _id: 'readerDoc', _class: document.class.Document, space: 'readerSpace' }],
  ['editorDoc', { _id: 'editorDoc', _class: document.class.Document, space: 'editorSpace' }],
  [user, { _id: user, _class: contact.class.SocialIdentity, attachedTo: person }],
  ['task', { _id: 'task', _class: task.class.Task, space, assignees: [person] }],
  ['otherTask', { _id: 'otherTask', _class: task.class.Task, space, assignees: [] }],
  ['event', { _id: 'event', _class: calendar.class.Event, space, user }],
  ['calendar', { _id: 'calendar', _class: calendar.class.Calendar, space, user }],
  ['todo', { _id: 'todo', _class: time.class.ToDo, space, user: person, attachedTo: 'otherTask', attachedToClass: task.class.Task }],
  ['otherEvent', { _id: 'otherEvent', _class: calendar.class.Event, space, user: 'other' }]
])
function fixture (role = AccountRole.User): { middleware: WorkspaceAuthorizationMiddleware, ctx: MeasureContext<SessionData>, forward: jest.Mock } {
  const forward = jest.fn(async () => [])
  const next = { tx: forward, findAll: async (_ctx: unknown, _class: string, query: any) => [...docs.values()].filter((doc: any) => doc._class === _class && (query._id?.$in?.includes(doc._id) || query._id === doc._id)) } as unknown as Middleware
  const context = { hierarchy: { isDerived: (actual: string, expected: string) => actual === expected || expected === core.class.AttachedDoc && [attachment.class.Attachment, calendar.class.Event, time.class.ToDo, task.class.Task].includes(actual as any) }, head: next } as unknown as PipelineContext
  const account = { uuid: 'account', role, primarySocialId: user, socialIds: [user] } as Account
  return { middleware: new WorkspaceAuthorizationMiddleware(context, next), ctx: { contextData: { account } } as MeasureContext<SessionData>, forward }
}
const update = (objectId: string, objectClass: string, operations: object, objectSpace = space): Tx => ({ _class: core.class.TxUpdateDoc, objectId, objectClass, operations, objectSpace }) as unknown as Tx

describe('server authorization before persistence', () => {
  it('allows assigned status and accessible descriptions, forwarding once', async () => {
    const { middleware, ctx, forward } = fixture()
    await middleware.tx(ctx, [update('task', task.class.Task, { status: 'done' }), update('otherTask', task.class.Task, { description: 'text' })])
    expect(forward).toHaveBeenCalledTimes(1)
  })
  it('enforces inherited reader/editor grants and denies editor deletion', async () => {
    const { middleware, ctx, forward } = fixture()
    await expect(middleware.tx(ctx, [update('readerDoc', document.class.Document, { title: 'new' }, 'readerSpace')])).rejects.toThrow()
    await middleware.tx(ctx, [update('editorDoc', document.class.Document, { title: 'new' }, 'editorSpace')])
    await expect(middleware.tx(ctx, [{ _class: core.class.TxRemoveDoc, objectId: 'editorDoc', objectClass: document.class.Document, objectSpace: 'editorSpace' } as unknown as Tx])).rejects.toThrow()
    expect(forward).toHaveBeenCalledTimes(1)
  })
  it('validates direct attachment parents rather than relying on collection wrappers', async () => {
    const { middleware, ctx, forward } = fixture()
    const create = (attachedTo: string): Tx => ({ _class: core.class.TxCreateDoc, objectId: 'upload', objectClass: attachment.class.Attachment, objectSpace: space, attributes: { attachedTo, attachedToClass: task.class.Task, collection: 'attachments' } }) as unknown as Tx
    await expect(middleware.tx(ctx, [create('hidden')])).rejects.toThrow('inaccessible parent')
    await middleware.tx(ctx, [create('task')])
    expect(forward).toHaveBeenCalledTimes(1)
  })
  it('permits standalone own events and prevents borrowed calendar ownership', async () => {
    const { middleware, ctx, forward } = fixture()
    const create: Tx = { _class: core.class.TxCreateDoc, objectId: 'new-event', objectClass: calendar.class.Event, objectSpace: space, attributes: { user, calendar: 'calendar', attachedTo: calendar.ids.NoAttached, attachedToClass: calendar.class.Event } } as unknown as Tx
    await middleware.tx(ctx, [create])
    await expect(middleware.tx(ctx, [{ ...create, attributes: { ...(create as any).attributes, calendar: 'hidden-calendar' } } as unknown as Tx])).rejects.toThrow()
    expect(forward).toHaveBeenCalledTimes(1)
  })
  it('prevents personal agenda completion from changing an unassigned task status', async () => {
    const { middleware, ctx } = fixture()
    await expect(middleware.tx(ctx, [update('todo', time.class.ToDo, { doneOn: 123 })])).rejects.toThrow()
    await middleware.tx(ctx, [update('todo', time.class.ToDo, { description: 'personal note' })])
  })
  it('rejects a batch containing any structural change without forwarding', async () => {
    const { middleware, ctx, forward } = fixture()
    await expect(middleware.tx(ctx, [update('task', task.class.Task, { description: 'text' }), update('task', task.class.Task, { dueDate: 0 })])).rejects.toThrow()
    expect(forward).not.toHaveBeenCalled()
  })
  it('rejects non-assigned status and other peoples events', async () => {
    const { middleware, ctx, forward } = fixture()
    await expect(middleware.tx(ctx, [update('otherTask', task.class.Task, { status: 'done' })])).rejects.toThrow()
    await expect(middleware.tx(ctx, [update('otherEvent', calendar.class.Event, { title: 'x' })])).rejects.toThrow()
    expect(forward).not.toHaveBeenCalled()
  })
  it('prevents hidden document references and forged spaces', async () => {
    const { middleware, ctx } = fixture()
    await expect(middleware.tx(ctx, [update('hidden', task.class.Task, { description: 'text' })])).rejects.toThrow()
    await expect(middleware.tx(ctx, [update('task', task.class.Task, { description: 'text' }, 'forged')])).rejects.toThrow()
  })
  it('lets Owner and Maintainer manage accessible structure', async () => {
    for (const role of [AccountRole.Owner, AccountRole.Maintainer]) {
      const { middleware, ctx, forward } = fixture(role)
      await middleware.tx(ctx, [update('task', task.class.Task, { dueDate: 0 })])
      expect(forward).toHaveBeenCalledTimes(1)
    }
  })
  it('refuses readonly members and preserves trusted trigger transactions', async () => {
    const { middleware, ctx, forward } = fixture(AccountRole.ReadOnlyGuest)
    await expect(middleware.tx(ctx, [update('task', task.class.Task, { description: 'text' })])).rejects.toThrow()
    ctx.contextData.isTriggerCtx = true
    await middleware.tx(ctx, [update('task', task.class.Task, { $inc: { comments: 1 } })])
    expect(forward).toHaveBeenCalledTimes(1)
  })
})
