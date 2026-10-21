import attachment from '@hcengineering/attachment'
import calendar, { type Event } from '@hcengineering/calendar'
import chunter from '@hcengineering/chunter'
import contact, { type Person, type SocialIdentity } from '@hcengineering/contact'
import core, {
  AccountRole, hasAccountRole, type Doc, type MeasureContext, type Ref, type SessionData,
  systemAccountUuid, TxProcessor, type AccountUuid, type SocialId, type Tx, type TxCreateDoc, type TxMixin, type TxUpdateDoc
} from '@hcengineering/core'
import drive, { type Folder } from '@hcengineering/drive'
import platform, { PlatformError, Severity, Status } from '@hcengineering/platform'
import document, { guidelineAccessFor, type Teamspace } from '@hcengineering/document'
import love, { MeetingStatus, isOffice, type ParticipantInfo, type MeetingMinutes } from '@hcengineering/love'
import notification from '@hcengineering/notification'
import preference from '@hcengineering/preference'
import tags, { type TagReference } from '@hcengineering/tags'
import task from '@hcengineering/task'
import tracker from '@hcengineering/tracker'
import time, { type ToDo } from '@hcengineering/time'
import { BaseMiddleware, type Middleware, type PipelineContext, type TxMiddlewareResult } from '@hcengineering/server-core'
import { changedFields, clientTransactions, isWorkspaceAdministrator } from './workspace-policy'

/** Runs before triggers; only trusted server trigger contexts can bypass client restrictions. */
export class WorkspaceAuthorizationMiddleware extends BaseMiddleware {
  static async create (_ctx: MeasureContext, context: PipelineContext, next?: Middleware): Promise<Middleware> {
    return new WorkspaceAuthorizationMiddleware(context, next)
  }

  async tx (ctx: MeasureContext<SessionData>, txes: Tx[]): Promise<TxMiddlewareResult> {
    const account = ctx.contextData.account
    if (account.uuid === systemAccountUuid || ctx.contextData.isTriggerCtx === true) return await this.provideTx(ctx, txes)
    const administrator = isWorkspaceAdministrator(account)
    const reader = this.context.head ?? this.next
    if (reader === undefined) throw new Error('Missing authorization reader.')
    const people = await reader.findAll(ctx, contact.class.SocialIdentity, { _id: { $in: account.socialIds } })
    const personIds = people.map((item) => item.attachedTo)
    const ownPeople = await reader.findAll(ctx, contact.class.Person, { personUuid: account.uuid })
    for (const person of ownPeople) if (!personIds.includes(person._id)) personIds.push(person._id)
    const hierarchy = this.context.hierarchy
    const pending = new Map<Ref<Doc>, Doc>()
    let verifiedIdentities: SocialId[] | undefined
    const getVerifiedSocialIds = this.context.contextVars?.getVerifiedSocialIds as
      ((account: AccountUuid) => Promise<SocialId[]>) | undefined
    for (const tx of clientTransactions(txes)) {
      const isDocument = hierarchy.isDerived(tx.objectClass, document.class.Document)
      const isTask = hierarchy.isDerived(tx.objectClass, task.class.Task)
      const isTrackerDocument = tx.objectClass.startsWith('tracker:')
      const isTrackerSector = hierarchy.isDerived(tx.objectClass, tracker.class.Project)
      if (isTrackerSector && tx._class === core.class.TxCreateDoc && !administrator) throw new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {}))
      const isTagReference = hierarchy.isDerived(tx.objectClass, tags.class.TagReference)
      const taskSequence = tx.objectClass === tracker.class.Project && tx._class === core.class.TxUpdateDoc && JSON.stringify((tx as TxUpdateDoc<Doc>).operations) === JSON.stringify({ $inc: { sequence: 1 } })
      const created = tx._class === core.class.TxCreateDoc
      const updated = tx._class === core.class.TxUpdateDoc
      const data = created
        ? TxProcessor.createDoc2Doc(tx as TxCreateDoc<Doc>)
        : pending.get(tx.objectId) ?? (await reader.findAll(ctx, tx.objectClass, { _id: tx.objectId }))[0]
      if (data === undefined || data.space !== tx.objectSpace) throw new Error('Cannot modify an inaccessible document or spoof its space.')
      const spaces = await reader.findAll(ctx, core.class.Space, { _id: tx.objectSpace })
      if (spaces.length === 0) throw new Error('Cannot modify an inaccessible space.')
      const trackerContent = hierarchy.isDerived(spaces[0]._class, tracker.class.Project)
      if (!trackerContent && !isTrackerDocument && !isTask && !isTagReference && !taskSequence && !hasAccountRole(account, AccountRole.User)) throw new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {}))
      if (!created && hierarchy.isDerived(tx.objectClass, love.class.ParticipantInfo)) {
        const participant = data as ParticipantInfo
        const nextParticipant = updated ? TxProcessor.updateDoc2Doc({ ...participant }, tx as TxUpdateDoc<ParticipantInfo>) : undefined
        if (!personIds.includes(participant.person) && (nextParticipant === undefined || nextParticipant.room !== participant.room || nextParticipant.person !== participant.person)) {
          const room = (await reader.findAll(ctx, love.class.Room, { _id: participant.room }))[0]
          if (room !== undefined && isOffice(room) && room.person === participant.person) {
            throw new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {}))
          }
        }
        if (nextParticipant !== undefined) pending.set(tx.objectId, nextParticipant)
      }
      if (administrator) {
        if (created) pending.set(tx.objectId, data)
        continue
      }
      if (created && hierarchy.isDerived(data._class, core.class.AttachedDoc)) {
        const attached = data as Doc & { attachedTo: Ref<Doc>, attachedToClass: any }
        const standaloneEvent = hierarchy.isDerived(data._class, calendar.class.Event) && attached.attachedTo === calendar.ids.NoAttached
        const standaloneTodo = data._class === time.class.ToDo && attached.attachedToClass === time.class.ToDo
        const standaloneIssue = hierarchy.isDerived(data._class, tracker.class.Issue) && attached.attachedTo === tracker.ids.NoParent && attached.attachedToClass === tracker.class.Issue && (data as Doc & { collection?: string }).collection === 'subIssues'
        if (!standaloneEvent && !standaloneTodo && !standaloneIssue) {
          const parent = pending.get(attached.attachedTo) ?? (await reader.findAll(ctx, attached.attachedToClass, { _id: attached.attachedTo }))[0]
          if (parent === undefined) throw new Error('Cannot attach content to an inaccessible parent.')
          // Workslots and personal agenda entries live in their own system spaces.
          if (parent.space !== tx.objectSpace && !hierarchy.isDerived(data._class, calendar.class.Event) && !hierarchy.isDerived(data._class, time.class.ToDo)) throw new Error('Cannot attach content across spaces.')
        }
      }
      const fields = updated ? changedFields((tx as TxUpdateDoc<Doc>).operations, isTask || taskSequence || isTrackerDocument || trackerContent) : []
      if (updated && fields.some((field) => (field === '*' ? tx.objectClass !== chunter.class.Channel : ['_id', '_class', ...(isTask || isDocument ? [] : ['space']), 'createdBy', 'createdOn', 'modifiedBy', 'modifiedOn'].includes(field)))) throw new Error('Cannot change document identity or move content.')
      if (isTask && updated && fields.includes('space')) {
        const moved = TxProcessor.updateDoc2Doc({ ...data }, tx as TxUpdateDoc<Doc>)
        if (typeof moved.space !== 'string' || (await reader.findAll(ctx, core.class.Space, { _id: moved.space })).length === 0) throw new Error('Cannot move a task to an inaccessible space.')
      }
      let allowed = false
      if (isTask || isTrackerDocument || trackerContent) {
        allowed = true
      } else if (isTagReference) {
        const reference = data as TagReference
        const parent = pending.get(reference.attachedTo) ??
          (await reader.findAll(ctx, reference.attachedToClass, { _id: reference.attachedTo }))[0]
        allowed = (created || tx._class === core.class.TxRemoveDoc) && reference.collection === 'labels' &&
          hierarchy.isDerived(reference.attachedToClass, task.class.Task) && parent !== undefined &&
          hierarchy.isDerived(parent._class, task.class.Task) && parent.space === reference.space
      } else if (taskSequence) {
        allowed = true
      } else if (tx.objectClass === core.class.UserStatus) {
        const status = data as Doc & { user: AccountUuid, online: boolean, anonymous?: boolean, connected?: boolean }
        const nextStatus = updated ? TxProcessor.updateDoc2Doc({ ...status }, tx as TxUpdateDoc<Doc>) : status
        allowed = status.user === account.uuid && typeof (nextStatus as typeof status).online === 'boolean' &&
          ((nextStatus as typeof status).anonymous === undefined || typeof (nextStatus as typeof status).anonymous === 'boolean') &&
          ((nextStatus as typeof status).connected === undefined || typeof (nextStatus as typeof status).connected === 'boolean') &&
          (created || (updated && fields.every((field) => field === 'online' || field === 'anonymous' || field === 'connected')))
      } else if (tx.objectClass === contact.class.Person && tx.objectSpace === contact.space.Contacts) {
        const person = data as Person
        const ownPerson = person.personUuid === account.uuid || (person.personUuid == null && personIds.includes(person._id))
        if (created) {
          const attributes = (tx as TxCreateDoc<Person>).attributes
          // Bootstrap only the authenticated account, never an arbitrary contact or employee.
          allowed = person.personUuid === account.uuid && ownPeople.length === 0 &&
            Object.keys(attributes).every((field) => ['personUuid', 'name', 'city', 'avatarType'].includes(field))
        } else if (updated) {
          const operations = (tx as TxUpdateDoc<Person>).operations
          allowed = ownPerson && Object.keys(operations).length === 1 && operations.personUuid === account.uuid
        } else if (tx._class === core.class.TxMixin) {
          const mixin = tx as TxMixin<Person, Person>
          const attributes = mixin.attributes as Record<string, unknown>
          allowed = ownPerson && mixin.mixin === contact.mixin.Employee &&
            ((Object.keys(attributes).length === 2 && attributes.active === true && attributes.role === 'USER' &&
                (person as unknown as Record<string, any>)[contact.mixin.Employee]?.active !== false) ||
              (Object.keys(attributes).length === 1 && typeof attributes.timezone === 'string'))
        }
        if (allowed && !personIds.includes(person._id)) personIds.push(person._id)
        if (allowed && created) ownPeople.push(person)
      } else if (tx.objectClass === contact.class.SocialIdentity && (created || updated)) {
        if (getVerifiedSocialIds !== undefined && (created || fields.every((field) => ['type', 'value', 'key', 'verifiedOn', 'isDeleted'].includes(field)))) {
          verifiedIdentities ??= await getVerifiedSocialIds(account.uuid)
          const identity = updated ? TxProcessor.updateDoc2Doc({ ...data }, tx as TxUpdateDoc<Doc>) : data
          const verified = verifiedIdentities.find((item) => item._id === identity._id)
          const local = identity as SocialIdentity
          const owner = pending.get(local.attachedTo) ?? (await reader.findAll(ctx, contact.class.Person, { _id: local.attachedTo }))[0]
          const ownsPerson = owner !== undefined && ((owner as Person).personUuid === account.uuid ||
            ((owner as Person).personUuid == null && personIds.includes(owner._id)))
          allowed = ownsPerson && local.attachedToClass === contact.class.Person && local.collection === 'socialIds' && personIds.includes(local.attachedTo) && verified !== undefined && verified.verifiedOn != null &&
            local.type === verified.type && local.value === verified.value && local.key === verified.key &&
            local.verifiedOn === verified.verifiedOn && (local.isDeleted === true) === (verified.isDeleted === true)
        }
      } else if (hierarchy.isDerived(tx.objectClass, time.class.ToDo)) {
        allowed = personIds.includes((data as ToDo).user) && (created || (updated && fields.every((field) => ['title', 'description', 'doneOn', 'priority', 'visibility', 'rank'].includes(field))) || tx._class === core.class.TxRemoveDoc)
        const todo = data as ToDo
        if (allowed && hierarchy.isDerived(todo.attachedToClass, task.class.Task) && (created || fields.includes('doneOn'))) {
          const parent = pending.get(todo.attachedTo) ?? (await reader.findAll(ctx, todo.attachedToClass, { _id: todo.attachedTo }))[0]
          allowed = parent !== undefined
        }
      } else if (hierarchy.isDerived(tx.objectClass, calendar.class.Event)) {
        const eventCalendar = (await reader.findAll(ctx, calendar.class.Calendar, { _id: (data as Event).calendar }))[0]
        allowed = (created ? eventCalendar !== undefined && account.socialIds.includes(eventCalendar.user) : true) && account.socialIds.includes((data as Event).user) && (created || (updated && fields.every((field) => [
          'title', 'description', 'date', 'dueDate', 'allDay', 'timeZone', 'visibility', 'participants',
          'externalParticipants', 'location', 'reminders', 'rules', 'rdate', 'exdate', 'isCancelled'
        ].includes(field))) || tx._class === core.class.TxRemoveDoc)
      } else if (hierarchy.isDerived(tx.objectClass, calendar.class.Calendar)) {
        allowed = account.socialIds.includes((data as Doc & { user: any }).user) && (created || (updated && fields.every((field) => ['name', 'hidden', 'visibility'].includes(field))))
      } else if (hierarchy.isDerived(tx.objectClass, calendar.class.Schedule)) {
        allowed = personIds.includes((data as Doc & { owner: Ref<Doc> }).owner) && (created || (updated && fields.every((field) => ['title', 'description', 'meetingDuration', 'meetingInterval', 'availability', 'timeZone', 'calendar'].includes(field))) || tx._class === core.class.TxRemoveDoc)
      } else if (hierarchy.isDerived(tx.objectClass, document.class.Document)) {
        const space = spaces[0] as Teamspace
        const sectors = await reader.findAll(ctx, core.class.TypedSpace, { _id: { $in: space.guidelineEditorSectors ?? [] } })
        const access = guidelineAccessFor(space, account.uuid, new Map(sectors.map((sector) => [sector._id, sector.members])))
        allowed = access === 'editor' && (data as Doc & { lockedBy?: unknown }).lockedBy == null && (created || tx._class === core.class.TxRemoveDoc || (updated && fields.every((field) => ['title', 'content', 'icon', 'color', 'space', 'parent', 'rank'].includes(field))))
        if (allowed && updated && fields.includes('space')) {
          const moved = TxProcessor.updateDoc2Doc({ ...data }, tx as TxUpdateDoc<Doc>)
          const destination = (await reader.findAll(ctx, core.class.Space, { _id: moved.space }))[0] as Teamspace | undefined
          if (destination === undefined) allowed = false
          else {
            const destinationSectors = await reader.findAll(ctx, core.class.TypedSpace, { _id: { $in: destination.guidelineEditorSectors ?? [] } })
            allowed = guidelineAccessFor(destination, account.uuid, new Map(destinationSectors.map((sector) => [sector._id, sector.members]))) === 'editor'
          }
        }
      } else if (hierarchy.isDerived(tx.objectClass, drive.class.Folder)) {
        allowed = created || tx._class === core.class.TxRemoveDoc
        if (created) {
          const folder = data as Folder
          if (folder.parent === drive.ids.Root) {
            allowed = Array.isArray(folder.path) && folder.path.length === 0
          } else {
            const parent = pending.get(folder.parent) ?? (await reader.findAll(ctx, drive.class.Folder, { _id: folder.parent }))[0]
            allowed = parent !== undefined && parent.space === folder.space &&
              hierarchy.isDerived(parent._class, drive.class.Folder) && Array.isArray(folder.path) &&
              JSON.stringify(folder.path) === JSON.stringify([parent._id, ...(parent as Folder).path])
          }
        }
      } else if (hierarchy.isDerived(tx.objectClass, attachment.class.Attachment)) {
        allowed = created
      } else if (hierarchy.isDerived(tx.objectClass, chunter.class.ChatMessage)) {
        allowed = created || (updated && data.createdBy !== undefined && account.socialIds.includes(data.createdBy) && fields.every((field) => ['message', 'editedOn'].includes(field)))
      } else if (tx.objectClass === chunter.class.Channel && updated) {
        const channel = data as Doc & { members: AccountUuid[], private: boolean, archived?: boolean }
        const operations = (tx as TxUpdateDoc<Doc>).operations as Record<string, any>
        // Array operators may only target the caller; never authorize other member changes.
        const operatorAllowed = Object.entries(operations).every(([key, value]) => {
          if (key === 'members') return Array.isArray(value)
          if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
          if (key === '$set') return Object.keys(value).length === 1 && Array.isArray(value.members)
          if (key !== '$push' && key !== '$pull') return false
          if (Object.keys(value).length !== 1 || value.members === undefined) return false
          const target = value.members
          if (target === account.uuid) return true
          if (target === null || typeof target !== 'object') return false
          const listKey = key === '$push' ? '$each' : '$in'
          return Object.keys(target).every((field) => field === listKey || (key === '$push' && field === '$position')) &&
            Array.isArray(target[listKey]) && target[listKey].length === 1 && target[listKey][0] === account.uuid
        })
        if (operatorAllowed && channel.archived !== true) {
          const nextChannel = TxProcessor.updateDoc2Doc({ ...channel, members: [...channel.members] }, tx as TxUpdateDoc<Doc>) as typeof channel
          const others = channel.members.filter((member) => member !== account.uuid)
          allowed = Array.isArray(nextChannel.members) &&
            nextChannel.members.every((member) => typeof member === 'string') &&
            nextChannel.members.filter((member) => member === account.uuid).length <= 1 &&
            JSON.stringify(nextChannel.members.filter((member) => member !== account.uuid)) === JSON.stringify(others) &&
            (channel.private === false || (channel.members.includes(account.uuid) && !nextChannel.members.includes(account.uuid)))
          if (allowed) pending.set(tx.objectId, nextChannel)
        }
      } else if (hierarchy.isDerived(tx.objectClass, core.class.Collaborator)) {
        allowed = (data as Doc & { collaborator: string }).collaborator === account.uuid && (created || tx._class === core.class.TxRemoveDoc)
      } else if (hierarchy.isDerived(tx.objectClass, notification.class.InboxNotification)) {
        allowed = (data as Doc & { user: string }).user === account.uuid && ((updated && fields.every((field) => ['isViewed', 'archived'].includes(field))) || tx._class === core.class.TxRemoveDoc)
      } else if (hierarchy.isDerived(tx.objectClass, notification.class.DocNotifyContext)) {
        allowed = (data as Doc & { user: string }).user === account.uuid && updated && fields.every((field) => ['isPinned', 'hidden', 'lastViewedTimestamp'].includes(field))
      } else if (hierarchy.isDerived(tx.objectClass, preference.class.Preference)) {
        allowed = created || (data.createdBy !== undefined && account.socialIds.includes(data.createdBy))
      } else if (tx.objectClass === love.class.MeetingMinutes) {
        const meeting = data as MeetingMinutes
        const room = (await reader.findAll(ctx, love.class.Room, { _id: meeting.attachedTo }))[0]
        allowed = created && meeting.attachedToClass === love.class.Room && meeting.collection === 'meetings' &&
          meeting.status === MeetingStatus.Active && meeting.description === null &&
          room !== undefined && room.space === meeting.space &&
          Object.keys((tx as TxCreateDoc<MeetingMinutes>).attributes).every((field) =>
            ['attachedTo', 'attachedToClass', 'collection', 'title', 'description', 'status'].includes(field))
      } else if (hierarchy.isDerived(tx.objectClass, love.class.ParticipantInfo)) {
        allowed = personIds.includes((data as Doc & { person: Ref<Doc> }).person) && (created || (updated && fields.every((field) => ['room', 'x', 'y', 'sessionId'].includes(field))) || tx._class === core.class.TxRemoveDoc)
        if (!allowed && updated && fields.every((field) => ['room', 'x', 'y'].includes(field))) {
          const participant = data as ParticipantInfo
          const sourceRoom = (await reader.findAll(ctx, love.class.Room, { _id: participant.room }))[0]
          const nextParticipant = TxProcessor.updateDoc2Doc({ ...participant }, tx as TxUpdateDoc<ParticipantInfo>)
          const destination = (await reader.findAll(ctx, love.class.Room, { _id: nextParticipant.room }))[0]
          allowed = sourceRoom !== undefined && isOffice(sourceRoom) && sourceRoom.person !== null &&
            personIds.includes(sourceRoom.person) && participant.person !== sourceRoom.person &&
            nextParticipant.room !== participant.room && nextParticipant.x === 0 && nextParticipant.y === 0 &&
            (nextParticipant.room === love.ids.Reception ||
              (destination !== undefined && isOffice(destination) && destination.person === participant.person))
        }
      }
      if (!allowed) throw new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {}))
      if (created) pending.set(tx.objectId, data)
      else if ((isTask || isDocument) && updated) pending.set(tx.objectId, TxProcessor.updateDoc2Doc({ ...data }, tx as TxUpdateDoc<Doc>))
    }
    return await this.provideTx(ctx, txes)
  }
}
