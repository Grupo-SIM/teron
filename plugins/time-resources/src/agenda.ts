import type { Calendar } from '@hcengineering/calendar'

export type AgendaMode = 'mine' | 'team'

export function migrateAgendaMode (saved: string | null): AgendaMode {
  return saved === 'all' || saved === 'team' ? 'team' : 'mine'
}

export function selectAgendaCalendars (
  calendars: Calendar[],
  mode: AgendaMode,
  ownIds: string[],
  personIds?: string[]
): Calendar[] {
  const users = mode === 'mine' ? ownIds : personIds
  return calendars.filter((item) => !item.hidden && (users === undefined || users.includes(item.user)))
}

/** Half-open local-day interval. setDate handles daylight-saving changes. */
export function agendaDayRange (date: Date): { from: number, to: number } {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { from: start.getTime(), to: end.getTime() }
}
