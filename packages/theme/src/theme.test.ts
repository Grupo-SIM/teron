//
// Copyright © 2026 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { getCurrentTheme, ThemeVariant } from './index'

describe('forced application theme', () => {
  it('ignores a stored light preference', () => {
    const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    const getItem = jest.fn(() => ThemeVariant.Light)
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: { getItem, setItem: jest.fn() }
      })

      expect(getCurrentTheme()).toBe(ThemeVariant.Dark)
      expect(getItem).not.toHaveBeenCalled()
    } finally {
      if (previousLocalStorage !== undefined) {
        Object.defineProperty(globalThis, 'localStorage', previousLocalStorage)
      } else {
        Reflect.deleteProperty(globalThis, 'localStorage')
      }
    }
  })

  it('returns dark without consulting the system preference', () => {
    const previousMatchMedia = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia')
    const matchMedia = jest.fn(() => ({ matches: false }))
    try {
      Object.defineProperty(globalThis, 'matchMedia', {
        configurable: true,
        value: matchMedia
      })

      expect(getCurrentTheme()).toBe(ThemeVariant.Dark)
      expect(matchMedia).not.toHaveBeenCalled()
    } finally {
      if (previousMatchMedia !== undefined) {
        Object.defineProperty(globalThis, 'matchMedia', previousMatchMedia)
      } else {
        Reflect.deleteProperty(globalThis, 'matchMedia')
      }
    }
  })
})
