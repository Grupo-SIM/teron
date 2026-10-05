import core, { AccountRole, type Account, type Doc, type MeasureContext, type SessionData, type SocialId, type Tx } from '@hcengineering/core'
import chunter from '@hcengineering/chunter'
import contact from '@hcengineering/contact'
import task from '@hcengineering/task'
import drive from '@hcengineering/drive'
import platform, { PlatformError } from '@hcengineering/platform'
import document from '@hcengineering/document'
import calendar from '@hcengineering/calendar'
import attachment from '@hcengineering/attachment'
import tracker from '@hcengineering/tracker'
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
  ['project', { _id: 'project', _class: tracker.class.Project, space, sequence: 1 }],
  ['task', { _id: 'task', _class: task.class.Task, space, assignees: [person] }],
  ['otherTask', { _id: 'otherTask', _class: task.class.Task, space, assignees: [] }],
  ['event', { _id: 'event', _class: calendar.class.Event, space, user }],
  ['calendar', { _id: 'calendar', _class: calendar.class.Calendar, space, user }],
  ['todo', { _id: 'todo', _class: time.class.ToDo, space, user: person, attachedTo: 'otherTask', attachedToClass: task.class.Task }],
  ['ownPresence', { _id: 'ownPresence', _class: core.class.UserStatus, space, user: 'account', online: false }],
  ['otherPresence', { _id: 'otherPresence', _class: core.class.UserStatus, space, user: 'other', online: false }],
  ['released', { _id: 'released', _class: contact.class.SocialIdentity, space, attachedTo: person, attachedToClass: contact.class.Person, collection: 'socialIds', type: 'email', value: 'old@example.test', key: 'email:old@example.test', verifiedOn: 100, isDeleted: false }],
  ['otherEvent', { _id: 'otherEvent', _class: calendar.class.Event, space, user: 'other' }]
])
function fixture (role = AccountRole.User, verifiedIdentities: SocialId[] = []): { middleware: WorkspaceAuthorizationMiddleware, ctx: MeasureContext<SessionData>, forward: jest.Mock } {
  const forward = jest.fn(async () => [])
  const next = { tx: forward, findAll: async (_ctx: unknown, _class: string, query: any) => [...docs.values()].filter((doc: any) => doc._class === _class && (query._id?.$in?.includes(doc._id) || query._id === doc._id || query.personUuid !== undefined && query.personUuid === doc.personUuid)) } as unknown as Middleware
  const context = { contextVars: { getVerifiedSocialIds: async () => verifiedIdentities }, hierarchy: { isDerived: (actual: string, expected: string) => actual === expected || actual === tracker.class.Issue && expected === task.class.Task || expected === core.class.AttachedDoc && [attachment.class.Attachment, contact.class.SocialIdentity, calendar.class.Event, time.class.ToDo, task.class.Task, tracker.class.Issue].includes(actual as any) }, head: next } as unknown as PipelineContext
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
  it.each([AccountRole.User, AccountRole.ReadOnlyGuest, AccountRole.DocGuest])('allows %s root issues and rejects nonexistent parents', async (role) => {
    const { middleware, ctx, forward } = fixture(role)
    const create = (attachedTo: string): Tx => ({
      _class: core.class.TxCreateDoc, objectId: 'new-issue', objectClass: tracker.class.Issue, objectSpace: space,
      attributes: { attachedTo, attachedToClass: tracker.class.Issue, collection: 'subIssues', title: 'New' }
    }) as unknown as Tx
    await middleware.tx(ctx, [create(tracker.ids.NoParent)])
    await expect(middleware.tx(ctx, [create('missing')])).rejects.toThrow()
    expect(forward).toHaveBeenCalledTimes(1)
  })
  it.each(Object.values(AccountRole))('allows %s task CRUD, unassigned status and sequence allocation', async (role) => {
    const { middleware, ctx, forward } = fixture(role)
    const create = { _class: core.class.TxCreateDoc, objectId: 'new-task', objectClass: task.class.Task, objectSpace: space, attributes: { attachedTo: 'task', attachedToClass: task.class.Task, collection: 'tasks', title: 'New' } } as unknown as Tx
    const remove = { _class: core.class.TxRemoveDoc, objectId: 'new-task', objectClass: task.class.Task, objectSpace: space } as unknown as Tx
    await middleware.tx(ctx, [update('project', tracker.class.Project, { $inc: { sequence: 1 } })])
    await middleware.tx(ctx, [{ _class: core.class.TxApplyIf, txes: [create, update('new-task', task.class.Task, { title: 'Changed', dueDate: 0 }), update('otherTask', task.class.Task, { status: 'done' }), update('task', task.class.Task, { $push: { assignees: 'other' } }), remove] } as unknown as Tx])
    expect(forward).toHaveBeenCalledTimes(2)
  })
  it.each([AccountRole.User, AccountRole.ReadOnlyGuest, AccountRole.DocGuest])('protects %s inaccessible parents, moves and project changes', async (role) => {
    const { middleware, ctx } = fixture(role)
    await middleware.tx(ctx, [update('task', task.class.Task, { space: 'readerSpace' })])
    await expect(middleware.tx(ctx, [update('task', task.class.Task, { space: 'hidden' })])).rejects.toThrow()
    await expect(middleware.tx(ctx, [update('task', task.class.Task, { $set: { '_id.value': 'forged' } })])).rejects.toThrow()
    await expect(middleware.tx(ctx, [update('project', tracker.class.Project, { $inc: { sequence: 2 } })])).rejects.toThrow()
    await expect(middleware.tx(ctx, [update('project', tracker.class.Project, { $inc: { sequence: 1 }, name: 'Forged' })])).rejects.toThrow()
    const create = { _class: core.class.TxCreateDoc, objectId: 'new-task', objectClass: task.class.Task, objectSpace: space, attributes: { attachedTo: 'hidden', attachedToClass: task.class.Task, collection: 'tasks' } } as unknown as Tx
    await expect(middleware.tx(ctx, [create])).rejects.toThrow()
  })
  it('allows assigned status and accessible descriptions, forwarding once', async () => {
    const { middleware, ctx, forward } = fixture()
    await middleware.tx(ctx, [update('task', task.class.Task, { status: 'done' }), update('otherTask', task.class.Task, { description: 'text' })])
    expect(forward).toHaveBeenCalledTimes(1)
  })
  it('allows members to estimate and change accessible task structure', async () => {
    const { middleware, ctx, forward } = fixture()
    await middleware.tx(ctx, [update('otherTask', task.class.Task, { estimation: 1.5 })])
    await middleware.tx(ctx, [update('otherTask', task.class.Task, { estimation: 2, dueDate: 0 })])
    expect(forward).toHaveBeenCalledTimes(2)
  })
  it('enforces inherited reader/editor grants for edits, moves and deletion', async () => {
    const { middleware, ctx, forward } = fixture()
    await expect(middleware.tx(ctx, [update('readerDoc', document.class.Document, { title: 'new' }, 'readerSpace')])).rejects.toThrow()
    await middleware.tx(ctx, [update('editorDoc', document.class.Document, { title: 'new' }, 'editorSpace')])
    await middleware.tx(ctx, [update('editorDoc', document.class.Document, { parent: 'parent', rank: 'rank' }, 'editorSpace')])
    await middleware.tx(ctx, [update('editorDoc', document.class.Document, { space: 'editorSpace', parent: 'parent', rank: 'rank' }, 'editorSpace')])
    await expect(middleware.tx(ctx, [update('editorDoc', document.class.Document, { space: 'readerSpace' }, 'editorSpace')])).rejects.toThrow()
    await expect(middleware.tx(ctx, [update('editorDoc', document.class.Document, { space: 'missing' }, 'editorSpace')])).rejects.toThrow()
    await middleware.tx(ctx, [{ _class: core.class.TxRemoveDoc, objectId: 'editorDoc', objectClass: document.class.Document, objectSpace: 'editorSpace' } as unknown as Tx])
    expect(forward).toHaveBeenCalledTimes(4)
  })
  it('requires editor access at both ends and preserves locked document protection', async () => {
    const { middleware, ctx, forward } = fixture()
    docs.set('destination', { _id: 'destination', _class: core.class.Space, guidelineAccess: true, guidelineEditors: ['account'] })
    docs.set('lockedDoc', { _id: 'lockedDoc', _class: document.class.Document, space: 'editorSpace', lockedBy: 'other' })
    try {
      await middleware.tx(ctx, [update('editorDoc', document.class.Document, { space: 'destination', parent: document.ids.NoParent, rank: 'rank' }, 'editorSpace')])
      await expect(middleware.tx(ctx, [update('readerDoc', document.class.Document, { space: 'destination' }, 'readerSpace')])).rejects.toThrow()
      await expect(middleware.tx(ctx, [update('lockedDoc', document.class.Document, { parent: document.ids.NoParent }, 'editorSpace')])).rejects.toThrow()
      for (const id of ['readerDoc', 'lockedDoc']) {
        await expect(middleware.tx(ctx, [{ _class: core.class.TxRemoveDoc, objectId: id, objectClass: document.class.Document, objectSpace: id === 'readerDoc' ? 'readerSpace' : 'editorSpace' } as unknown as Tx])).rejects.toThrow()
      }
      expect(forward).toHaveBeenCalledTimes(1)
    } finally {
      docs.delete('destination')
      docs.delete('lockedDoc')
    }
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
  it('allows personal agenda completion linked to an unassigned task', async () => {
    const { middleware, ctx } = fixture()
    await middleware.tx(ctx, [update('todo', time.class.ToDo, { doneOn: 123 })])
    await middleware.tx(ctx, [update('todo', time.class.ToDo, { description: 'personal note' })])
  })
  it('rejects a batch containing an inaccessible task without forwarding', async () => {
    const { middleware, ctx, forward } = fixture()
    await expect(middleware.tx(ctx, [update('task', task.class.Task, { description: 'text' }), update('hidden', task.class.Task, { dueDate: 0 })])).rejects.toThrow()
    expect(forward).not.toHaveBeenCalled()
  })
  it('rejects other peoples events', async () => {
    const { middleware, ctx, forward } = fixture()
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
  it('bootstraps an invited member without allowing another account or employee privilege escalation', async () => {
    const verified = { _id: 'first-social', type: 'email', value: 'invite@example.test', key: 'email:invite@example.test', verifiedOn: 200 } as SocialId
    const { middleware, ctx, forward } = fixture(AccountRole.User, [verified])
    const create = (personUuid = 'account'): Tx => ({ _class: core.class.TxCreateDoc, objectId: 'invited-person', objectClass: contact.class.Person, objectSpace: contact.space.Contacts, attributes: { personUuid, name: 'Invited person', city: '', avatarType: 'color' } }) as unknown as Tx
    const employee = (attributes: object = { active: true, role: 'USER' }): Tx => ({ _class: core.class.TxMixin, objectId: 'invited-person', objectClass: contact.class.Person, objectSpace: contact.space.Contacts, mixin: contact.mixin.Employee, attributes }) as unknown as Tx
    docs.set(contact.space.Contacts, { _id: contact.space.Contacts, _class: core.class.Space })
    try {
      const identity = { _class: core.class.TxCreateDoc, objectId: verified._id, objectClass: contact.class.SocialIdentity, objectSpace: contact.space.Contacts, attributes: { attachedTo: 'invited-person', attachedToClass: contact.class.Person, collection: 'socialIds', type: verified.type, value: verified.value, key: verified.key, verifiedOn: verified.verifiedOn } } as unknown as Tx
      await middleware.tx(ctx, [create(), identity, employee()])
      await expect(middleware.tx(ctx, [create(), { ...create(), objectId: 'duplicate-person' } as unknown as Tx])).rejects.toThrow()
      await expect(middleware.tx(ctx, [create('someone-else')])).rejects.toThrow()
      docs.set('invited-person', { _id: 'invited-person', _class: contact.class.Person, space: contact.space.Contacts, personUuid: 'account' })
      await middleware.tx(ctx, [employee()])
      await expect(middleware.tx(ctx, [create()])).rejects.toThrow()
      await expect(middleware.tx(ctx, [employee({ active: true, role: 'OWNER' })])).rejects.toThrow()
      await expect(middleware.tx(ctx, [employee({ active: true, role: 'USER', forged: true })])).rejects.toThrow()
      docs.set('invited-person', { _id: 'invited-person', _class: contact.class.Person, space: contact.space.Contacts, personUuid: 'someone-else' })
      await expect(middleware.tx(ctx, [employee()])).rejects.toThrow()
      docs.set('invited-person', { _id: 'invited-person', _class: contact.class.Person, space: contact.space.Contacts, personUuid: 'account', [contact.mixin.Employee]: { active: false, role: 'USER' } })
      await expect(middleware.tx(ctx, [employee()])).rejects.toThrow()
      expect(forward).toHaveBeenCalledTimes(2)
    } finally { docs.delete('invited-person'); docs.delete(contact.space.Contacts) }
  })
  it('links and initializes only the caller legacy person and verifies the first local social identity', async () => {
    const verified = { _id: 'first-social', type: 'email', value: 'invite@example.test', key: 'email:invite@example.test', verifiedOn: 200 } as SocialId
    const { middleware, ctx, forward } = fixture(AccountRole.User, [verified])
    docs.set(contact.space.Contacts, { _id: contact.space.Contacts, _class: core.class.Space })
    docs.set(person, { _id: person, _class: contact.class.Person, space: contact.space.Contacts })
    const createIdentity: Tx = { _class: core.class.TxCreateDoc, objectId: verified._id, objectClass: contact.class.SocialIdentity, objectSpace: contact.space.Contacts, attributes: { attachedTo: person, attachedToClass: contact.class.Person, collection: 'socialIds', type: verified.type, value: verified.value, key: verified.key, verifiedOn: verified.verifiedOn } } as unknown as Tx
    try {
      await middleware.tx(ctx, [update(person, contact.class.Person, { personUuid: 'account' }, contact.space.Contacts)])
      await middleware.tx(ctx, [createIdentity])
      await expect(middleware.tx(ctx, [update(person, contact.class.Person, { personUuid: 'other' }, contact.space.Contacts)])).rejects.toThrow()
      await expect(middleware.tx(ctx, [update(person, contact.class.Person, { name: 'Changed' }, contact.space.Contacts)])).rejects.toThrow()
      await expect(middleware.tx(ctx, [{ ...createIdentity, attributes: { ...(createIdentity as any).attributes, value: 'forged@example.test' } } as unknown as Tx])).rejects.toThrow()
      docs.set(person, { _id: person, _class: contact.class.Person, space: contact.space.Contacts, personUuid: 'other' })
      await expect(middleware.tx(ctx, [update(person, contact.class.Person, { personUuid: 'account' }, contact.space.Contacts)])).rejects.toThrow()
      expect(forward).toHaveBeenCalledTimes(2)
    } finally { docs.delete(person); docs.delete(contact.space.Contacts) }
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
  it('refuses readonly non-task edits and preserves trusted trigger transactions', async () => {
    const { middleware, ctx, forward } = fixture(AccountRole.ReadOnlyGuest)
    await expect(middleware.tx(ctx, [update('event', calendar.class.Event, { title: 'text' })])).rejects.toThrow()
    ctx.contextData.isTriggerCtx = true
    await middleware.tx(ctx, [update('task', task.class.Task, { $inc: { comments: 1 } })])
    expect(forward).toHaveBeenCalledTimes(1)
  })
})
