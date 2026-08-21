// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.

const DAY_MS = 24 * 60 * 60 * 1000

export function remainingRatioByStartedDays (periodStart: number, periodEnd: number, effectiveAt: number): number {
  const duration = Math.max(1, periodEnd - periodStart)
  const elapsed = Math.max(0, Math.min(duration, effectiveAt - periodStart))
  const totalDays = Math.max(1, Math.ceil(duration / DAY_MS))
  const elapsedDays = Math.min(totalDays, Math.ceil(elapsed / DAY_MS))
  return (totalDays - elapsedDays) / totalDays
}
