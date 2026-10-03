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
  it('redacts foreign private events for Owner too, including projections and nested lookups', async () => {
    const { middleware, ctx } = fixture()
    expect((await middleware.findAll(ctx, calendar.class.Event, {}))[0].title).toBe('')
    expect((await middleware.findAll(ctx, calendar.class.Event, {}, { projection: { title: 1 } } as any))[0].title).toBe('')
    const rows: any = await middleware.findAll(ctx, core.class.Doc, {})
    expect(rows[0].$lookup.events[0].description).toBe('')
  })
  it('restricts predicates on details and removes private fulltext hits/counts', async () => {
    const { middleware, ctx, find } = fixture()
    await middleware.findAll(ctx, calendar.class.Event, { title: 'Secret' })
    expect(find.mock.calls.some((call) => call[2].$and !== undefined)).toBe(true)
    expect(await middleware.searchFulltext(ctx, { query: 'Secret' }, {})).toEqual({ docs: [], total: 0 })
  })
  it('targets raw realtime payloads to owner and sends only invalidation to everyone else', async () => {
    const { middleware, ctx } = fixture()
    const tx: any = { _id: 'tx', _class: core.class.TxUpdateDoc, objectId: event._id, objectClass: calendar.class.Event, operations: { title: 'Secret' } }
    ctx.contextData.broadcast.txes.push(tx)
    await middleware.handleBroadcast(ctx)
    expect(await ctx.contextData.broadcast.targets.calendarPrivacy(tx)).toEqual({ target: ['other-account'] })
    const invalidation: any = ctx.contextData.broadcast.txes[1]
    expect(invalidation.event).toBe(WorkspaceEvent.BulkUpdate)
    expect(invalidation._class).toBe(core.class.TxWorkspaceEvent)
    expect(JSON.stringify(invalidation)).not.toContain('Secret')
  })
})
