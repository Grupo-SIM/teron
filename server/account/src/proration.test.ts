// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.

import { remainingRatioByStartedDays } from './proration'

describe('remainingRatioByStartedDays', () => {
  it('excludes four started days from a 30-day period', () => {
    const start = Date.parse('2026-08-16T21:00:00.000Z')
    const end = Date.parse('2026-09-15T21:00:00.000Z')
    const effectiveAt = Date.parse('2026-08-20T20:00:00.000Z')

    expect(remainingRatioByStartedDays(start, end, effectiveAt)).toBeCloseTo(26 / 30)
  })

  it('returns the full period at its exact start and zero at its end', () => {
    const start = Date.parse('2026-08-01T00:00:00.000Z')
    const end = Date.parse('2026-09-01T00:00:00.000Z')

    expect(remainingRatioByStartedDays(start, end, start)).toBe(1)
    expect(remainingRatioByStartedDays(start, end, end)).toBe(0)
  })
})
