import { getDayRange } from './day-range'

describe('calendar day range', () => {
  it('ends at next midnight even when the selected date has a time', () => {
    const date = new Date(2026, 9, 7, 17, 42, 31)
    expect(getDayRange(date)).toEqual({
      from: new Date(2026, 9, 7).getTime(),
      to: new Date(2026, 9, 8).getTime()
    })
    expect(date.getHours()).toBe(17)
  })

  it('covers exactly the three displayed days across month boundaries', () => {
    expect(getDayRange(new Date(2026, 9, 30, 12), 3)).toEqual({
      from: new Date(2026, 9, 30).getTime(),
      to: new Date(2026, 10, 2).getTime()
    })
  })

  it('uses local midnight across daylight-saving transitions', () => {
    const previousTimezone = process.env.TZ
    process.env.TZ = 'America/New_York'
    try {
      const spring = getDayRange(new Date(2026, 2, 8, 12))
      const autumn = getDayRange(new Date(2026, 10, 1, 12))
      expect(spring.to - spring.from).toBe(23 * 60 * 60 * 1000)
      expect(autumn.to - autumn.from).toBe(25 * 60 * 60 * 1000)
    } finally {
      if (previousTimezone === undefined) delete process.env.TZ
      else process.env.TZ = previousTimezone
    }
  })
})
