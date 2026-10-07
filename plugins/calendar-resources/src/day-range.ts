/** Local midnight boundaries, including days with daylight-saving transitions. */
export function getDayRange (date: Date, days = 1): { from: number, to: number } {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + days)
  return { from: start.getTime(), to: end.getTime() }
}
