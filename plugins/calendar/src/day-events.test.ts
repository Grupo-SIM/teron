import calendar, { type Event, type ReccuringInstance } from './index'
import { getAllEvents } from './utils'

const from = new Date(2026, 9, 3).getTime()
const to = new Date(2026, 9, 4).getTime()
function event (date: number, dueDate: number, allDay = false): Event {
  return { _class: calendar.class.Event, date, dueDate, allDay } as Event
}

describe('daily events', () => {
  it('includes all-day and overlapping events in chronological order', () => {
    const events = [event(from + 2000, from + 3000), event(from - 1000, from + 1000), event(from, to, true)]
    const result = getAllEvents(events, from, to)
    expect(result.map((item) => item.date)).toEqual([from, from, from + 2000])
    expect(result.some((item) => item.allDay)).toBe(true)
    expect(events[1].date).toBe(from - 1000)
  })
  it('preserves original times for editing when clipping is disabled', () => {
    expect(getAllEvents([event(from - 1000, to + 1000)], from, to, false)[0]).toMatchObject({ date: from - 1000, dueDate: to + 1000 })
  })
  it('excludes ordinary events touching the day without overlapping it', () => {
    expect(getAllEvents([event(from - 1000, from), event(to, to + 1000)], from, to)).toEqual([])
  })
  it('applies the same half-open interval to persisted recurring instances', () => {
    const instances = [event(from - 1000, from), event(to, to + 1000), event(from, from + 1000)].map((item) => ({
      ...item, _class: calendar.class.ReccuringInstance, recurringEventId: 'series'
    })) as ReccuringInstance[]
    expect(getAllEvents(instances, from, to)).toHaveLength(1)
  })
})
