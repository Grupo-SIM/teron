import attachment from '@hcengineering/attachment'
import calendar, { type Event } from '@hcengineering/calendar'
import chunter from '@hcengineering/chunter'
import contact, { type SocialIdentity } from '@hcengineering/contact'
import core, {
  AccountRole, hasAccountRole, type Doc, type MeasureContext, type Ref, type SessionData,
  systemAccountUuid, TxProcessor, type AccountUuid, type SocialId, type Tx, type TxCreateDoc, type TxUpdateDoc
} from '@hcengineering/core'
import document, { guidelineAccessFor, type Teamspace } from '@hcengineering/document'
import love from '@hcengineering/love'
import notification from '@hcengineering/notification'
import preference from '@hcengineering/preference'
import task, { getTaskAssignees, type Task } from '@hcengineering/task'
import time, { type ToDo } from '@hcengineering/time'
import { BaseMiddleware, type Middleware, type PipelineContext, type TxMiddlewareResult } from '@hcengineering/server-core'
import { changedFields, clientTransactions, isWorkspaceAdministrator, memberTaskUpdateAllowed } from './workspace-policy'

/** Runs before triggers; only trusted server trigger contexts can bypass client restrictions. */
export class WorkspaceAuthorizationMiddleware extends BaseMiddleware {
  static async create (_ctx: MeasureContext, context: PipelineContext, next?: Middleware): Promise<Middleware> {
    return new WorkspaceAuthorizationMiddleware(context, next)
  }

  async tx (ctx: MeasureContext<SessionData>, txes: Tx[]): Promise<TxMiddlewareResult> {
    const account = ctx.contextData.account
    if (account.uuid === systemAccountUuid || ctx.contextData.isTriggerCtx === true) return await this.provideTx(ctx, txes)
    const administrator = isWorkspaceAdministrator(account)
    if (!hasAccountRole(account, AccountRole.User)) throw new Error('Workspace is read-only for this member.')
    const reader = this.context.head ?? this.next
    if (reader === undefined) throw new Error('Missing authorization reader.')
    const people = await reader.findAll(ctx, contact.class.SocialIdentity, { _id: { $in: account.socialIds } })
    const personIds = people.map((item) => item.attachedTo)
    const hierarchy = this.context.hierarchy
    const pending = new Map<Ref<Doc>, Doc>()
    let verifiedIdentities: SocialId[] | undefined
    const getVerifiedSocialIds = this.context.contextVars?.getVerifiedSocialIds as
      ((account: AccountUuid) => Promise<SocialId[]>) | undefined
    for (const tx of clientTransactions(txes)) {
      const created = tx._class === core.class.TxCreateDoc
      const updated = tx._class === core.class.TxUpdateDoc
      const data = created
        ? TxProcessor.createDoc2Doc(tx as TxCreateDoc<Doc>)
        : pending.get(tx.objectId) ?? (await reader.findAll(ctx, tx.objectClass, { _id: tx.objectId }))[0]
      if (data === undefined || data.space !== tx.objectSpace) throw new Error('Cannot modify an inaccessible document or spoof its space.')
      const spaces = await reader.findAll(ctx, core.class.Space, { _id: tx.objectSpace })
      if (spaces.length === 0) throw new Error('Cannot modify an inaccessible space.')
      if (administrator) {
        if (created) pending.set(tx.objectId, data)
        continue
      }
      if (created && hierarchy.isDerived(data._class, core.class.AttachedDoc)) {
        const attached = data as Doc & { attachedTo: Ref<Doc>, attachedToClass: any }
        const standaloneEvent = hierarchy.isDerived(data._class, calendar.class.Event) && attached.attachedTo === calendar.ids.NoAttached
        const standaloneTodo = data._class === time.class.ToDo && attached.attachedToClass === time.class.ToDo
        if (!standaloneEvent && !standaloneTodo) {
          const parent = pending.get(attached.attachedTo) ?? (await reader.findAll(ctx, attached.attachedToClass, { _id: attached.attachedTo }))[0]
          if (parent === undefined) throw new Error('Cannot attach content to an inaccessible parent.')
          // Workslots and personal agenda entries live in their own system spaces.
          if (parent.space !== tx.objectSpace && !hierarchy.isDerived(data._class, calendar.class.Event) && !hierarchy.isDerived(data._class, time.class.ToDo)) throw new Error('Cannot attach content across spaces.')
        }
      }
      const fields = updated ? changedFields((tx as TxUpdateDoc<Doc>).operations) : []
      if (updated && fields.some((field) => ['*', '_id', '_class', 'space', 'createdBy', 'createdOn', 'modifiedBy', 'modifiedOn'].includes(field))) throw new Error('Cannot change document identity or move content.')
      let allowed = false
      if (hierarchy.isDerived(tx.objectClass, task.class.Task)) {
        allowed = memberTaskUpdateAllowed(tx, data, personIds)
      } else if (tx.objectClass === contact.class.SocialIdentity && (created || updated)) {
        if (getVerifiedSocialIds !== undefined && (created || fields.every((field) => ['type', 'value', 'key', 'verifiedOn', 'isDeleted'].includes(field)))) {
          verifiedIdentities ??= await getVerifiedSocialIds(account.uuid)
          const identity = updated ? TxProcessor.updateDoc2Doc({ ...data }, tx as TxUpdateDoc<Doc>) : data
          const verified = verifiedIdentities.find((item) => item._id === identity._id)
          const local = identity as SocialIdentity
          allowed = local.collection === 'socialIds' && personIds.includes(local.attachedTo) && verified !== undefined && verified.verifiedOn != null &&
            local.type === verified.type && local.value === verified.value && local.key === verified.key &&
            local.verifiedOn === verified.verifiedOn && (local.isDeleted === true) === (verified.isDeleted === true)
        }
      } else if (hierarchy.isDerived(tx.objectClass, time.class.ToDo)) {
        allowed = personIds.includes((data as ToDo).user) && (created || (updated && fields.every((field) => ['title', 'description', 'doneOn', 'priority', 'visibility', 'rank'].includes(field))) || tx._class === core.class.TxRemoveDoc)
        const todo = data as ToDo
        if (allowed && hierarchy.isDerived(todo.attachedToClass, task.class.Task) && (created || fields.includes('doneOn'))) {
          const parent = pending.get(todo.attachedTo) ?? (await reader.findAll(ctx, todo.attachedToClass, { _id: todo.attachedTo }))[0]
          allowed = parent !== undefined && getTaskAssignees(parent as Task).some((person) => personIds.includes(person))
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
        allowed = access === 'editor' && (data as Doc & { lockedBy?: unknown }).lockedBy == null && (created || (updated && fields.every((field) => ['title', 'content', 'icon', 'color'].includes(field))))
      } else if (hierarchy.isDerived(tx.objectClass, attachment.class.Attachment)) {
        allowed = created
      } else if (hierarchy.isDerived(tx.objectClass, chunter.class.ChatMessage)) {
        allowed = created || (updated && data.createdBy !== undefined && account.socialIds.includes(data.createdBy) && fields.every((field) => ['message', 'editedOn'].includes(field)))
      } else if (hierarchy.isDerived(tx.objectClass, core.class.Collaborator)) {
        allowed = (data as Doc & { collaborator: string }).collaborator === account.uuid && (created || tx._class === core.class.TxRemoveDoc)
      } else if (hierarchy.isDerived(tx.objectClass, notification.class.InboxNotification)) {
        allowed = (data as Doc & { user: string }).user === account.uuid && ((updated && fields.every((field) => ['isViewed', 'archived'].includes(field))) || tx._class === core.class.TxRemoveDoc)
      } else if (hierarchy.isDerived(tx.objectClass, notification.class.DocNotifyContext)) {
        allowed = (data as Doc & { user: string }).user === account.uuid && updated && fields.every((field) => ['isPinned', 'hidden', 'lastViewedTimestamp'].includes(field))
      } else if (hierarchy.isDerived(tx.objectClass, preference.class.Preference)) {
        allowed = created || (data.createdBy !== undefined && account.socialIds.includes(data.createdBy))
      } else if (hierarchy.isDerived(tx.objectClass, love.class.ParticipantInfo)) {
        allowed = personIds.includes((data as Doc & { person: Ref<Doc> }).person) && (created || (updated && fields.every((field) => ['room', 'x', 'y', 'sessionId'].includes(field))) || tx._class === core.class.TxRemoveDoc)
      }
      if (!allowed) throw new Error('Member is not authorized to change workspace structure or this document.')
      if (created) pending.set(tx.objectId, data)
    }
    return await this.provideTx(ctx, txes)
  }
}
