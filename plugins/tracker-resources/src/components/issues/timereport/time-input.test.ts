import { hoursPerUnit, toHours } from './time-input'

describe('time input units', () => {
  it('stores hours, working days and minutes as hours', () => {
    expect(toHours(2, 'hours')).toBe(2)
    expect(toHours(1, 'days')).toBe(8)
    expect(toHours(30, 'minutes')).toBe(0.5)
    expect(toHours(0, 'days')).toBe(0)
    expect(toHours(0.5, 'days')).toBe(4)
  })
  it('preserves duration when displaying another unit', () => {
    for (const unit of ['hours', 'days', 'minutes'] as const) {
      expect(toHours(2 / hoursPerUnit(unit), unit)).toBe(2)
    }
  })
})
