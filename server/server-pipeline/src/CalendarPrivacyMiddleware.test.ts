import calendar, { AccessLevel, type Calendar, type Event } from '@hcengineering/calendar'
import core, { AccountRole, WorkspaceEvent, type MeasureContext, type SessionData } from '@hcengineering/core'
import type { Middleware, PipelineContext } from '@hcengineering/server-core'
import { busyEvent, CalendarPrivacyMiddleware, eventDetailsAllowed } from './CalendarPrivacyMiddleware'
const event: any = { _id: 'event', _class: calendar.class.Event, space: 'calendar-space', user: 'other', calendar: 'cal', visibility: 'private', title: 'Secret', description: 'Confidential', date: 100, dueDate: 200, allDay: false, participants: ['person'], location: 'Private location', attachedTo: 'hidden-document', attachments: 3 }
const calendars: any = [{ _id: 'cal', visibility: 'private' }]
function fixture (): { middleware: CalendarPrivacyMiddleware, ctx: MeasureContext<SessionData>, find: jest.Mock } {
  const find = jest.fn(async (_ctx: unknown, clazz: string, _query: any, options?: any) => {
    const result: any = clazz === calendar.class.Calendar ? calendars : clazz === calendar.class.Event ? (options?.projection ? [{ _id: event._id, title: event.title }] : [event]) : [{ _id: 'parent', $lookup: { events: [event] } }]
    result.total = result.length
    return result
  })
  const next = { findAll: find, searchFulltext: async () => ({ total: 99, docs: [{ doc: event, title: 'Secret' }] }), handleBroadcast: async () => {} } as unknown as Middleware
  const hierarchy = { isDerived: (actual: string, expected: string) => actual === expected || expected === core.class.Doc, getDescendants: (clazz: string) => [clazz] }
  const middleware = new CalendarPrivacyMiddleware({ hierarchy } as unknown as PipelineContext, next)
  const ctx = { contextData: { account: { uuid: 'account', role: AccountRole.Owner, socialIds: ['own'] }, socialStringsToUsers: new Map([['other', { accontUuid: 'other-account' }]]), removedMap: new Map(), broadcast: { txes: [], targets: {} } } } as unknown as MeasureContext<SessionData>
  return { middleware, ctx, find }
}
describe('server calendar privacy', () => {
  it('uses ownership and explicit/default calendar visibility', () => {
    const map = new Map<any, Calendar>([['cal', calendars[0]]])
    expect(eventDetailsAllowed(event, map, ['other'])).toBe(true)
    expect(eventDetailsAllowed(event, map, ['own'])).toBe(false)
    expect(eventDetailsAllowed({ ...event, visibility: 'public' }, map, ['own'])).toBe(true)
    expect(eventDetailsAllowed({ ...event, visibility: undefined }, map, ['own'])).toBe(false)
  })
  it('keeps occupied intervals and recurrence while removing all private details', () => {
    const busy = busyEvent({ ...event, rules: [{ freq: 'DAILY' }] } as Event)
    expect(busy).toMatchObject({ date: 100, dueDate: 200, title: '', description: '', participants: [], access: AccessLevel.FreeBusyReader, rules: [{ freq: 'DAILY' }] })
    expect(busy).not.toHaveProperty('location')
    expect(busy).not.toHaveProperty('attachments')
    expect(busy.attachedTo).not.toBe('hidden-document')
  })
  it('preserves identity and intervals from cached documents with inherited metadata', () => {
    const cached = Object.create(event) as Event
    expect(busyEvent(cached)).toMatchObject({ _id: event._id, _class: event._class, space: event.space, calendar: event.calendar, user: event.user, date: 100, dueDate: 200 })
  })
  it('redacts foreign private events for Owner too, including projections and nested lookups', async () => {
    const { middleware, ctx } = fixture()
    expect((await middleware.findAll(ctx, calendar.class.Event, {}))[0].title).toBe('')
    expect((await middleware.findAll(ctx, calendar.class.Event, {}, { projection: { title: 1 } } as any))[0].title).toBe('')
    const rows: any = await middleware.findAll(ctx, core.class.Doc, {})
    expect(rows[0].$lookup.events[0].description).toBe('')
  })
  it('restores identity omitted by lookup query compression and preserves compressed lookups', async () => {
    const { middleware, ctx, find } = fixture()
    find.mockImplementation(async (_ctx: unknown, clazz: string, query: any) => {
      if (clazz === calendar.class.Calendar) return Object.assign([...calendars], { total: 1 })
      if (clazz === calendar.class.Event) {
        const row = { ...event }
        if (query._id === event._id) delete row._id
        return Object.assign([row], { total: 1 })
      }
      return Object.assign([{ _id: 'parent', $lookup: { event: 1 } }], { total: 1, lookupMap: { 1: event } })
    })
    const direct = await middleware.findAll(ctx, calendar.class.Event, { _id: event._id })
    expect(direct[0]).toMatchObject({ _id: event._id, title: '', date: 100 })
    const nested = await middleware.findAll(ctx, core.class.Doc, {}, { lookup: {} })
    expect(nested.lookupMap?.['1']).toMatchObject({ _id: event._id, title: '', date: 100 })
  })
  it('protects private event attachments in base-document reads, lookups and realtime', async () => {
    const { middleware, ctx, find } = fixture()
    const attached: any = { _id: 'attachment', _class: core.class.AttachedDoc, attachedTo: event._id, attachedToClass: event._class, name: 'Private file' }
    find.mockImplementation(async (_ctx: unknown, clazz: string) => Object.assign(clazz === calendar.class.Calendar ? [...calendars] : clazz === calendar.class.Event ? [event] : [attached], { total: 1 }))
    expect(await middleware.findAll(ctx, core.class.Doc, { _id: attached._id })).toHaveLength(0)
    const tx: any = { _id: 'attachment-tx', _class: core.class.TxCreateDoc, objectId: attached._id, objectClass: attached._class }
    ctx.contextData.broadcast.txes.push(tx)
    await middleware.handleBroadcast(ctx)
    expect(await ctx.contextData.broadcast.targets.calendarPrivacy(tx)).toEqual({ target: ['other-account'] })
  })
  it('restricts predicates on details and removes private fulltext hits/counts', async () => {
    const { middleware, ctx, find } = fixture()
    await middleware.findAll(ctx, calendar.class.Event, { title: 'Secret' })
    expect(find.mock.calls.some((call) => call[2].$and !== undefined)).toBe(true)
    expect(await middleware.searchFulltext(ctx, { query: 'Secret' }, {})).toEqual({ docs: [], total: undefined })
  })
  it('applies search privacy before limits and preserves authorized totals', async () => {
    const { middleware, ctx } = fixture()
    const search = jest.fn(async () => ({ docs: [{ doc: { _id: 'public', _class: core.class.Doc } }], total: 17 }))
    ;(middleware as any).next.searchFulltext = search
    const result = await middleware.searchFulltext(ctx, { query: 'Reunião' }, { limit: 1 })
    expect(search.mock.calls[0]).toEqual([ctx, { query: 'Reunião', excludeDocIds: [event._id] }, { limit: 1 }])
    expect(result.total).toBe(17)
  })
  it('targets raw realtime payloads to owner and sends only invalidation to everyone else', async () => {
    const { middleware, ctx } = fixture()
    const tx: any = { _id: 'tx', _class: core.class.TxUpdateDoc, objectId: event._id, objectClass: calendar.class.Event, operations: { title: 'Secret' } }
    ctx.contextData.broadcast.targets.spaceSec = async () => ({ target: ['workspace-member'] })
    ctx.contextData.broadcast.txes.push(tx)
    await middleware.handleBroadcast(ctx)
    expect(await ctx.contextData.broadcast.targets.calendarPrivacy(tx)).toEqual({ target: ['other-account'] })
    expect(Object.keys(ctx.contextData.broadcast.targets)[0]).toBe('calendarPrivacy')
    const invalidation: any = ctx.contextData.broadcast.txes[1]
    expect(invalidation.event).toBe(WorkspaceEvent.BulkUpdate)
    expect(invalidation._class).toBe(core.class.TxWorkspaceEvent)
    expect(JSON.stringify(invalidation)).not.toContain('Secret')
  })
})
