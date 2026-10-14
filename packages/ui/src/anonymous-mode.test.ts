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

import { anonymousMode } from './anonymous-mode'
import { get } from 'svelte/store'

describe('Anonymous mode preference', () => {
  afterEach(() => { anonymousMode.set(false) })

  test('persists toggles on this device', () => {
    anonymousMode.set(true)
    expect(get(anonymousMode)).toBe(true)
    expect(localStorage.getItem('#platform.anonymous-mode')).toBe('true')
    anonymousMode.set(false)
    expect(localStorage.getItem('#platform.anonymous-mode')).toBe('false')
  })

  test('synchronizes another tab', () => {
    localStorage.setItem('#platform.anonymous-mode', 'true')
    window.dispatchEvent(new StorageEvent('storage', { key: '#platform.anonymous-mode' }))
    expect(get(anonymousMode)).toBe(true)
    localStorage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null }))
    expect(get(anonymousMode)).toBe(false)
  })
})
