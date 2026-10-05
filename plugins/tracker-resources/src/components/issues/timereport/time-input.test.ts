import { durationParts, hoursPerUnit, toHours } from './time-input'

describe('time input units', () => {
  it('stores hours, calendar days and minutes as hours', () => {
    expect(toHours(2, 'hours')).toBe(2)
    expect(toHours(1, 'days')).toBe(24)
    expect(toHours(30, 'minutes')).toBe(0.5)
    expect(toHours(0, 'days')).toBe(0)
    expect(toHours(0.5, 'days')).toBe(12)
  })
  it('preserves duration when displaying another unit', () => {
    for (const unit of ['hours', 'days', 'minutes'] as const) {
      expect(toHours(2 / hoursPerUnit(unit), unit)).toBe(2)
    }
  })
})

describe('duration display', () => {
  it('uses 24-hour days without changing stored hours', () => {
    expect(durationParts(12)).toEqual({ days: 0, hours: 12, minutes: 0 })
    expect(durationParts(28)).toEqual({ days: 1, hours: 4, minutes: 0 })
    expect(durationParts(58 + 25 / 60)).toEqual({ days: 2, hours: 10, minutes: 25 })
  })
  it('carries rounded minutes into hours and days', () => {
    expect(durationParts(23 + 59.9 / 60)).toEqual({ days: 1, hours: 0, minutes: 0 })
    expect(durationParts(0)).toEqual({ days: 0, hours: 0, minutes: 0 })
  })
})
