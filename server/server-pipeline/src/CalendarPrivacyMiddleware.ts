import calendar, { AccessLevel, type Calendar, type Event } from '@hcengineering/calendar'
import core, {
  type Class, type Doc, type DocumentQuery, type FindOptions, type FindResult, type MeasureContext,
  type Ref, type Domain, type SearchOptions, type SearchQuery, type SearchResult, type SessionData,
  systemAccountUuid, toFindResult, type TxCUD, TxProcessor
} from '@hcengineering/core'
import { BaseMiddleware, createBroadcastEvent, type Middleware, type PipelineContext } from '@hcengineering/server-core'

const busyFields = new Set(['_id', '_class', 'space', 'calendar', 'user', 'date', 'dueDate', 'allDay', 'timeZone', 'rules', 'rdate', 'exdate', 'originalStartTime', 'recurringEventId', 'isCancelled', 'virtual', 'blockTime'])
export function eventDetailsAllowed (event: Event, calendars: Map<Ref<Calendar>, Calendar>, socialIds: readonly string[]): boolean {
  if (socialIds.includes(event.user)) return true
  return event.visibility === 'public' || (event.visibility == null && calendars.get(event.calendar)?.visibility === 'public')
}
export function busyEvent (event: Event): Event {
  return {
    ...Object.fromEntries([...busyFields].filter((key) => (event as any)[key] !== undefined).map((key) => [key, (event as any)[key]])),
    title: '', description: '', participants: [], visibility: 'private', access: AccessLevel.FreeBusyReader,
    attachedTo: event._id, attachedToClass: calendar.class.Event, collection: 'events'
  } as Event
}

function intersectQuery<T extends Doc> (query: DocumentQuery<T>, restriction: DocumentQuery<T>): DocumentQuery<T> {
  const { $search, ...predicates } = query
  return { ...($search === undefined ? {} : { $search }), $and: [predicates, restriction] }
}

/** Privacy applies to reads, lookups, global search and realtime, even for workspace administrators. */
export class CalendarPrivacyMiddleware extends BaseMiddleware {
  static async create (_ctx: MeasureContext, context: PipelineContext, next?: Middleware): Promise<Middleware> {
    return new CalendarPrivacyMiddleware(context, next)
  }
  private trusted (ctx: MeasureContext<SessionData>): boolean {
    return ctx.contextData == null || ctx.contextData.account.uuid === systemAccountUuid || ctx.contextData.isTriggerCtx === true
  }
  private async calendars (ctx: MeasureContext<SessionData>): Promise<Map<Ref<Calendar>, Calendar>> {
    const rows = await this.provideFindAll(ctx, calendar.class.Calendar, {})
    return new Map(rows.map((row) => [row._id, row]))
  }
  override async findAll<T extends Doc> (ctx: MeasureContext<SessionData>, clazz: Ref<Class<T>>, query: DocumentQuery<T>, options?: FindOptions<T>): Promise<FindResult<T>> {
    if (this.trusted(ctx)) return await this.provideFindAll(ctx, clazz, query, options)
    const hierarchy = this.context.hierarchy
    if (!hierarchy.isDerived(clazz, calendar.class.Event) && !hierarchy.isDerived(calendar.class.Event, clazz) && !hierarchy.isDerived(clazz, core.class.AttachedDoc) && !hierarchy.isDerived(clazz, core.class.Tx) && options?.lookup == null) {
      return await this.provideFindAll(ctx, clazz, query, options)
    }
    const socialIds = ctx.contextData.account.socialIds
    const calendars = await this.calendars(ctx)
    let secured = query
    if (hierarchy.isDerived(clazz, calendar.class.Event) || hierarchy.isDerived(calendar.class.Event, clazz)) {
      // A detail predicate must not reveal private content through matching IDs/counts.
      const sensitive = (value: any): boolean => Object.entries(value ?? {}).some(([key, item]) => key === '$search' || (!key.startsWith('$') && !busyFields.has(key)) || (key.startsWith('$') && typeof item === 'object' && (Array.isArray(item) ? item.some(sensitive) : sensitive(item))))
      if (sensitive(query) || Object.keys(options?.sort ?? {}).some((key) => !busyFields.has(key))) {
        const publicCalendars = [...calendars.values()].filter((row) => row.visibility === 'public').map((row) => row._id)
        secured = intersectQuery(query, { $or: [{ _class: { $nin: hierarchy.getDescendants(calendar.class.Event) } }, { user: { $in: socialIds } }, { visibility: 'public' }, { visibility: { $exists: false }, calendar: { $in: publicCalendars } }] } as DocumentQuery<T>)
      }
    }
    if (hierarchy.isDerived(clazz, core.class.AttachedDoc) && !hierarchy.isDerived(clazz, calendar.class.Event)) {
      const events = await this.provideFindAll(ctx, calendar.class.Event, {})
      const privateEvents = events.filter((event) => !eventDetailsAllowed(event, calendars, socialIds)).map((event) => event._id)
      if (privateEvents.length > 0) secured = intersectQuery(secured, { attachedTo: { $nin: privateEvents } } as DocumentQuery<T>)
    }
    // Event transaction history contains original details; only its author can read it.
    if (hierarchy.isDerived(clazz, core.class.Tx)) {
      secured = intersectQuery(secured, { $or: [{ objectClass: { $nin: hierarchy.getDescendants(calendar.class.Event) } }, { modifiedBy: { $in: socialIds } }] } as DocumentQuery<T>)
    }
    const rows = await this.provideFindAll(ctx, clazz, secured, options)
    const sanitize = async (value: any, expectedEvent = false): Promise<any> => {
      if (value == null || typeof value !== 'object') return value
      if (Array.isArray(value)) return await Promise.all(value.map((item) => sanitize(item)))
      if (expectedEvent || (value._class != null && hierarchy.isDerived(value._class, calendar.class.Event))) {
        // Projection cannot remove the metadata needed to decide privacy.
        const fetched = (await this.provideFindAll(ctx, calendar.class.Event, { _id: value._id }))[0]
        // LookupMiddleware removes scalar predicates from wire documents. Restore
        // identity before redaction; the client cannot infer this nested query.
        const full = fetched == null ? undefined : { ...fetched, _id: value._id }
        if (full == null) return undefined
        if (!eventDetailsAllowed(full, calendars, socialIds)) {
          return busyEvent(full)
        }
      }
      const result = { ...value }
      if (result.$lookup != null) result.$lookup = Object.fromEntries(await Promise.all(Object.entries(result.$lookup).map(async ([key, entry]) => [key, await sanitize(entry)])))
      return result
    }
    const scalarPredicates = Object.fromEntries(Object.entries(secured).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)))
    const lookupMap = rows.lookupMap == null ? undefined : Object.fromEntries(await Promise.all(Object.entries(rows.lookupMap).map(async ([key, value]) => [key, await sanitize(value)])))
    return toFindResult(await Promise.all(rows.map((row) => sanitize({ ...scalarPredicates, ...row }, hierarchy.isDerived(clazz, calendar.class.Event)))), rows.total, lookupMap)
  }
  override async groupBy<T, P extends Doc> (ctx: MeasureContext<SessionData>, domain: Domain, field: string, query?: DocumentQuery<P>): Promise<Map<T, number>> {
    if (this.trusted(ctx) || domain !== this.context.hierarchy.getDomain(calendar.class.Event)) return await this.provideGroupBy(ctx, domain, field, query)
    const calendars = await this.calendars(ctx)
    const publicCalendars = [...calendars.values()].filter((row) => row.visibility === 'public').map((row) => row._id)
    // Aggregate requests cannot be redacted after grouping: restrict their input instead.
    const secured = { $and: [query ?? {}, { $or: [{ _class: { $nin: this.context.hierarchy.getDescendants(calendar.class.Event) } }, { user: { $in: ctx.contextData.account.socialIds } }, { visibility: 'public' }, { visibility: { $exists: false }, calendar: { $in: publicCalendars } }] }] } as DocumentQuery<P>
    return await this.provideGroupBy(ctx, domain, field, secured)
  }
  override async searchFulltext (ctx: MeasureContext<SessionData>, query: SearchQuery, options: SearchOptions): Promise<SearchResult> {
    const result = await this.provideSearchFulltext(ctx, query, options)
    if (this.trusted(ctx)) return result
    const calendars = await this.calendars(ctx)
    const docs = []
    for (const row of result.docs) {
      if (this.context.hierarchy.isDerived(row.doc._class, calendar.class.Event) || row.doc.attachedToClass != null && this.context.hierarchy.isDerived(row.doc.attachedToClass, calendar.class.Event)) {
        const event = (await this.provideFindAll(ctx, calendar.class.Event, { _id: this.context.hierarchy.isDerived(row.doc._class, calendar.class.Event) ? row.doc._id : row.doc.attachedTo as Ref<Event> }))[0]
        if (event == null || !eventDetailsAllowed(event, calendars, ctx.contextData.account.socialIds)) continue
      }
      docs.push(row)
    }
    return { ...result, docs, total: docs.length }
  }
  override async handleBroadcast (ctx: MeasureContext<SessionData>): Promise<void> {
    // Event payloads go only to their owner. Other clients refresh through a detail-free event.
    const events = ctx.contextData.broadcast.txes.filter((tx) => TxProcessor.isExtendsCUD(tx._class) && this.context.hierarchy.isDerived((tx as TxCUD<Doc>).objectClass, calendar.class.Event)) as TxCUD<Event>[]
    if (events.length > 0) {
      const ids = new Set(events.map((tx) => tx._id))
      const privacyTarget = async (tx: any) => {
        if (!ids.has(tx._id)) return undefined
        const cud = tx as TxCUD<Event>
        const event = (await this.provideFindAll(ctx, calendar.class.Event, { _id: cud.objectId }))[0] ?? ctx.contextData.removedMap.get(cud.objectId) as Event | undefined
        const account = event == null ? undefined : ctx.contextData.socialStringsToUsers.get(event.user)?.accontUuid
        return { target: account == null ? [] : [account] }
      }
      // Broadcast chooses the first matching target. Privacy must precede
      // general space routing, including targets installed during tx handling.
      ctx.contextData.broadcast.targets = { calendarPrivacy: privacyTarget, ...ctx.contextData.broadcast.targets }
      ctx.contextData.broadcast.txes.push(createBroadcastEvent([calendar.class.Event]))
    }
    await this.next?.handleBroadcast(ctx)
  }
}
