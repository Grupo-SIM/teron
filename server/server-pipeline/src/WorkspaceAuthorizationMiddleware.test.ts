import core, { AccountRole, type Account, type Doc, type MeasureContext, type SessionData, type SocialId, type Tx } from '@hcengineering/core'
import chunter from '@hcengineering/chunter'
import contact from '@hcengineering/contact'
import task from '@hcengineering/task'
import drive from '@hcengineering/drive'
import platform, { PlatformError } from '@hcengineering/platform'
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
  ['folder', { _id: 'folder', _class: drive.class.Folder, space, parent: drive.ids.Root, path: [], createdBy: 'other' }],
  ['foreignFolder', { _id: 'foreignFolder', _class: drive.class.Folder, space: 'foreign', parent: drive.ids.Root, path: [] }],
  [user, { _id: user, _class: contact.class.SocialIdentity, attachedTo: person }],
  ['task', { _id: 'task', _class: task.class.Task, space, assignees: [person] }],
  ['otherTask', { _id: 'otherTask', _class: task.class.Task, space, assignees: [] }],
  ['event', { _id: 'event', _class: calendar.class.Event, space, user }],
  ['calendar', { _id: 'calendar', _class: calendar.class.Calendar, space, user }],
  ['todo', { _id: 'todo', _class: time.class.ToDo, space, user: person, attachedTo: 'otherTask', attachedToClass: task.class.Task }],
  ['ownPresence', { _id: 'ownPresence', _class: core.class.UserStatus, space, user: 'account', online: false }],
  ['otherPresence', { _id: 'otherPresence', _class: core.class.UserStatus, space, user: 'other', online: false }],
  ['released', { _id: 'released', _class: contact.class.SocialIdentity, space, attachedTo: person, collection: 'socialIds', type: 'email', value: 'old@example.test', key: 'email:old@example.test', verifiedOn: 100, isDeleted: false }],
  ['otherEvent', { _id: 'otherEvent', _class: calendar.class.Event, space, user: 'other' }]
])
function fixture (role = AccountRole.User, verifiedIdentities: SocialId[] = []): { middleware: WorkspaceAuthorizationMiddleware, ctx: MeasureContext<SessionData>, forward: jest.Mock } {
  const forward = jest.fn(async () => [])
  const next = { tx: forward, findAll: async (_ctx: unknown, _class: string, query: any) => [...docs.values()].filter((doc: any) => doc._class === _class && (query._id?.$in?.includes(doc._id) || query._id === doc._id)) } as unknown as Middleware
  const context = { contextVars: { getVerifiedSocialIds: async () => verifiedIdentities }, hierarchy: { isDerived: (actual: string, expected: string) => actual === expected || expected === core.class.AttachedDoc && [attachment.class.Attachment, contact.class.SocialIdentity, calendar.class.Event, time.class.ToDo, task.class.Task].includes(actual as any) }, head: next } as unknown as PipelineContext
  const account = { uuid: 'account', role, primarySocialId: user, socialIds: [user] } as Account
  return { middleware: new WorkspaceAuthorizationMiddleware(context, next), ctx: { contextData: { account } } as MeasureContext<SessionData>, forward }
}
const update = (objectId: string, objectClass: string, operations: object, objectSpace = space): Tx => ({ _class: core.class.TxUpdateDoc, objectId, objectClass, operations, objectSpace }) as unknown as Tx

describe('server authorization before persistence', () => {
  it('allows only self membership changes in public channels, including array operators', async () => {
    const { middleware, ctx, forward } = fixture()
    docs.set('channel', { _id: 'channel', _class: chunter.class.Channel, space, private: false, members: ['other'] })
    try {
      await middleware.tx(ctx, [update('channel', chunter.class.Channel, { members: ['other', 'account'] })])
      await middleware.tx(ctx, [update('channel', chunter.class.Channel, { $push: { members: 'account' } })])
      await middleware.tx(ctx, [update('channel', chunter.class.Channel, { $push: { members: { $each: ['account'], $position: 0 } } })])
      await expect(middleware.tx(ctx, [update('channel', chunter.class.Channel, { members: ['account'] })])).rejects.toThrow()
      await expect(middleware.tx(ctx, [update('channel', chunter.class.Channel, { $push: { members: 'stranger' } })])).rejects.toThrow()
      await expect(middleware.tx(ctx, [update('channel', chunter.class.Channel, { members: ['other', 'account'], private: true })])).rejects.toThrow()
      await expect(middleware.tx(ctx, [update('channel', chunter.class.Channel, { members: ['other', 'account', 'account'] })])).rejects.toThrow()
      docs.set('channel', { _id: 'channel', _class: chunter.class.Channel, space, private: true, members: ['other'] })
      await expect(middleware.tx(ctx, [update('channel', chunter.class.Channel, { members: ['other', 'account'] })])).rejects.toThrow()
      docs.set('channel', { _id: 'channel', _class: chunter.class.Channel, space, private: true, members: ['other', 'account'] })
      await middleware.tx(ctx, [update('channel', chunter.class.Channel, { $pull: { members: 'account' } })])
      await expect(middleware.tx(ctx, [update('channel', chunter.class.Channel, { members: ['other'] }), update('channel', chunter.class.Channel, { members: ['other', 'account'] })])).rejects.toThrow()
      expect(forward).toHaveBeenCalledTimes(4)
    } finally { docs.delete('channel') }
  })
  it('allows User folder creation/deletion but rejects updates and inaccessible parents', async () => {
    const { middleware, ctx, forward } = fixture()
    const create = (parent: string, path: string[]): Tx => ({ _class: core.class.TxCreateDoc, objectId: 'new-folder', objectClass: drive.class.Folder, objectSpace: space, attributes: { title: 'Folder', parent, path } }) as unknown as Tx
    await middleware.tx(ctx, [create(drive.ids.Root, [])])
    await middleware.tx(ctx, [create('folder', ['folder'])])
    await middleware.tx(ctx, [{ _class: core.class.TxRemoveDoc, objectId: 'folder', objectClass: drive.class.Folder, objectSpace: space } as unknown as Tx])
    await expect(middleware.tx(ctx, [create('missing', ['missing'])])).rejects.toBeInstanceOf(PlatformError)
    await expect(middleware.tx(ctx, [create('foreignFolder', ['foreignFolder'])])).rejects.toBeInstanceOf(PlatformError)
    await expect(middleware.tx(ctx, [create('folder', [])])).rejects.toBeInstanceOf(PlatformError)
    await expect(middleware.tx(ctx, [update('folder', drive.class.Folder, { title: 'New' })])).rejects.toMatchObject({ status: { code: platform.status.Forbidden } })
    expect(forward).toHaveBeenCalledTimes(3)
  })
  it('allows assigned status and accessible descriptions, forwarding once', async () => {
    const { middleware, ctx, forward } = fixture()
    await middleware.tx(ctx, [update('task', task.class.Task, { status: 'done' }), update('otherTask', task.class.Task, { description: 'text' })])
    expect(forward).toHaveBeenCalledTimes(1)
  })
  it('allows members to estimate accessible tasks without changing structural fields', async () => {
    const { middleware, ctx, forward } = fixture()
    await middleware.tx(ctx, [update('otherTask', task.class.Task, { estimation: 1.5 })])
    await expect(middleware.tx(ctx, [update('otherTask', task.class.Task, { estimation: 2, dueDate: 0 })])).rejects.toThrow()
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
  it('synchronizes only authoritative verified identities belonging to the caller', async () => {
    const verified = { _id: 'new', type: 'email', value: 'new@example.test', key: 'email:new@example.test', verifiedOn: 200, isDeleted: false } as SocialId
    const released = { _id: 'released', type: 'email', value: 'old@example.test#released', key: 'email:old@example.test#released', verifiedOn: 100, isDeleted: true } as SocialId
    const { middleware, ctx, forward } = fixture(AccountRole.User, [verified, released])
    const create = (attributes: object): Tx => ({ _class: core.class.TxCreateDoc, objectId: 'new', objectClass: contact.class.SocialIdentity, objectSpace: space,
      attributes: { attachedTo: person, attachedToClass: contact.class.Person, collection: 'socialIds', ...verified, ...attributes } }) as unknown as Tx
    docs.set(person, { _id: person, _class: contact.class.Person, space })
    try {
      await middleware.tx(ctx, [create({})])
      await middleware.tx(ctx, [update('released', contact.class.SocialIdentity, { value: released.value, key: released.key, isDeleted: true })])
      await expect(middleware.tx(ctx, [create({ value: 'forged@example.test' })])).rejects.toThrow()
      await expect(middleware.tx(ctx, [create({ verifiedOn: 999 })])).rejects.toThrow()
      await expect(middleware.tx(ctx, [create({ attachedTo: 'another-person' })])).rejects.toThrow()
      await expect(middleware.tx(ctx, [update('released', contact.class.SocialIdentity, { attachedTo: 'another-person' })])).rejects.toThrow()
      expect(forward).toHaveBeenCalledTimes(2)
    } finally { docs.delete(person) }
  })
  it('permits own online presence without accepting other accounts or identity changes', async () => {
    const { middleware, ctx, forward } = fixture()
    const create = (user: string): Tx => ({ _class: core.class.TxCreateDoc, objectId: 'presence', objectClass: core.class.UserStatus, objectSpace: space, attributes: { user, online: true } }) as unknown as Tx
    await middleware.tx(ctx, [create('account')])
    await expect(middleware.tx(ctx, [create('other')])).rejects.toThrow()
    await middleware.tx(ctx, [update('ownPresence', core.class.UserStatus, { online: true })])
    await expect(middleware.tx(ctx, [update('otherPresence', core.class.UserStatus, { online: true })])).rejects.toThrow()
    await expect(middleware.tx(ctx, [update('ownPresence', core.class.UserStatus, { user: 'other' })])).rejects.toThrow()
    await expect(middleware.tx(ctx, [update('ownPresence', core.class.UserStatus, { online: 'true' })])).rejects.toThrow()
    expect(forward).toHaveBeenCalledTimes(2)
  })
  it('refuses readonly members and preserves trusted trigger transactions', async () => {
    const { middleware, ctx, forward } = fixture(AccountRole.ReadOnlyGuest)
    await expect(middleware.tx(ctx, [update('task', task.class.Task, { description: 'text' })])).rejects.toThrow()
    ctx.contextData.isTriggerCtx = true
    await middleware.tx(ctx, [update('task', task.class.Task, { $inc: { comments: 1 } })])
    expect(forward).toHaveBeenCalledTimes(1)
  })
})
