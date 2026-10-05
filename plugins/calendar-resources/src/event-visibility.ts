import type { Calendar, Event } from '@hcengineering/calendar'
import type { IdMap } from '@hcengineering/core'

export function canViewEventDetails (event: Event, calendars: IdMap<Calendar>, socialIds: readonly string[]): boolean {
  if (socialIds.includes(event.user)) return true
  if (event.visibility === 'freeBusy' || event.visibility === 'private') return false
  if (event.visibility === 'public') return true
  return calendars.get(event.calendar)?.visibility === 'public'
}
