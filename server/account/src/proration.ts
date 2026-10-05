// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.

const DAY_MS = 24 * 60 * 60 * 1000

export interface ProrationDays {
  days: number
  periodDays: number
  remainingRatio: number
}

export function getProrationDays (periodStart: number, periodEnd: number, effectiveAt: number): ProrationDays {
  const duration = Math.max(1, periodEnd - periodStart)
  const elapsed = Math.max(0, Math.min(duration, effectiveAt - periodStart))
  const periodDays = Math.max(1, Math.ceil(duration / DAY_MS))
  const elapsedDays = Math.min(periodDays, Math.ceil(elapsed / DAY_MS))
  const days = periodDays - elapsedDays
  return { days, periodDays, remainingRatio: days / periodDays }
}

export function remainingRatioByStartedDays (periodStart: number, periodEnd: number, effectiveAt: number): number {
  return getProrationDays(periodStart, periodEnd, effectiveAt).remainingRatio
}
