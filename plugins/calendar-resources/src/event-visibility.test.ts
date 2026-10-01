import type { Calendar, Event } from '@hcengineering/calendar'
import type { IdMap } from '@hcengineering/core'
import { canViewEventDetails } from './event-visibility'

const owner = 'owner'
const viewer = 'viewer'
const calendarId = 'calendar' as Event['calendar']

function event (visibility?: Event['visibility']): Event {
  return { user: owner, calendar: calendarId, visibility } as Event
}

function calendars (visibility?: Calendar['visibility']): IdMap<Calendar> {
  const result: IdMap<Calendar> = new Map()
  if (visibility !== undefined) result.set(calendarId, { visibility } as Calendar)
  return result
}

describe('canViewEventDetails', () => {
  it('shows an owner their event even without createdBy or a loaded calendar', () => {
    expect(canViewEventDetails(event('private'), calendars(), [owner])).toBe(true)
  })

  it('hides private and free-busy details from another account', () => {
    expect(canViewEventDetails(event('private'), calendars('public'), [viewer])).toBe(false)
    expect(canViewEventDetails(event('freeBusy'), calendars('public'), [viewer])).toBe(false)
  })

  it('hides inherited visibility until the calendar is loaded', () => {
    expect(canViewEventDetails(event(), calendars(), [viewer])).toBe(false)
    expect(canViewEventDetails(event(), calendars('private'), [viewer])).toBe(false)
    expect(canViewEventDetails(event(), calendars('public'), [viewer])).toBe(true)
  })

  it('shows an explicitly public event', () => {
    expect(canViewEventDetails(event('public'), calendars(), [viewer])).toBe(true)
  })
})
