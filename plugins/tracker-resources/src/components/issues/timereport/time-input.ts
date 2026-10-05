export type TimeUnit = 'hours' | 'days' | 'minutes'

export function hoursPerUnit (unit: TimeUnit): number {
  return unit === 'days' ? 8 : unit === 'minutes' ? 1 / 60 : 1
}

export function toHours (value: number, unit: TimeUnit): number {
  return value * hoursPerUnit(unit)
}
