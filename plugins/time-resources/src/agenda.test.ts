import type { Calendar } from '@hcengineering/calendar'
import { agendaDayRange, migrateAgendaMode, selectAgendaCalendars } from './agenda'

const calendars = [
  { user: 'me', hidden: false },
  { user: 'other', hidden: false },
  { user: 'me', hidden: true }
] as Calendar[]

describe('agenda selection', () => {
  it('migrates task modes without retaining task filters', () => {
    expect(migrateAgendaMode('all')).toBe('team')
    for (const mode of [null, 'planned', 'date', 'tag', 'unplanned']) expect(migrateAgendaMode(mode)).toBe('mine')
  })
  it('keeps personal agendas separate from team agendas', () => {
    expect(selectAgendaCalendars(calendars, 'mine', ['me'])).toEqual([calendars[0]])
    expect(selectAgendaCalendars(calendars, 'team', ['me'])).toEqual(calendars.slice(0, 2))
    expect(selectAgendaCalendars(calendars, 'team', ['me'], ['other'])).toEqual([calendars[1]])
    expect(selectAgendaCalendars(calendars, 'team', ['me'], [])).toEqual([])
  })
  it('does not mutate the selected date and ends at next midnight', () => {
    const date = new Date(2026, 9, 3, 12)
    const range = agendaDayRange(date)
    expect(new Date(range.from).getHours()).toBe(0)
    expect(new Date(range.to).getDate()).toBe(4)
    expect(date.getHours()).toBe(12)
  })
})
