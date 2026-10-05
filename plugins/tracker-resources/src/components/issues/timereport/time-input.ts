export type TimeUnit = 'hours' | 'days' | 'minutes'

export function hoursPerUnit (unit: TimeUnit): number {
  return unit === 'days' ? 24 : unit === 'minutes' ? 1 / 60 : 1
}

export function toHours (value: number, unit: TimeUnit): number {
  return value * hoursPerUnit(unit)
}

export function durationParts (value: number): { days: number, hours: number, minutes: number } {
  const totalMinutes = Math.max(0, Math.round(value * 60))
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor(totalMinutes / 60) % 24,
    minutes: totalMinutes % 60
  }
}
