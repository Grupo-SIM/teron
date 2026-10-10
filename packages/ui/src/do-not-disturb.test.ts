// Jest runs CommonJS; Svelte 4 exposes its store runtime as ESM.
jest.mock('svelte/store', () => ({
  writable: (initial: boolean) => {
    let value = initial
    const subscribers = new Set<(value: boolean) => void>()
    return {
      subscribe (callback: (value: boolean) => void) {
        subscribers.add(callback)
        callback(value)
        return () => subscribers.delete(callback)
      },
      set (next: boolean) {
        if (value === next) return
        value = next
        subscribers.forEach(callback => callback(value))
      }
    }
  },
  get: (store: any) => {
    let value: boolean | undefined
    store.subscribe((next: boolean) => { value = next })()
    return value
  }
}))

import { doNotDisturb } from './do-not-disturb'
import { get } from 'svelte/store'

describe('Do Not Disturb preference', () => {
  afterEach(() => { doNotDisturb.set(false) })

  test('persists toggles on this device', () => {
    doNotDisturb.set(true)
    expect(get(doNotDisturb)).toBe(true)
    expect(localStorage.getItem('#platform.do-not-disturb')).toBe('true')
    doNotDisturb.set(false)
    expect(localStorage.getItem('#platform.do-not-disturb')).toBe('false')
  })

  test('synchronizes another tab', () => {
    localStorage.setItem('#platform.do-not-disturb', 'true')
    window.dispatchEvent(new StorageEvent('storage', { key: '#platform.do-not-disturb' }))
    expect(get(doNotDisturb)).toBe(true)
    localStorage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null }))
    expect(get(doNotDisturb)).toBe(false)
  })
})
