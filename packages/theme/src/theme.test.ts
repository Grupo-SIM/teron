//
// Copyright © 2026 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { getCurrentLanguage, getCurrentTheme, setDefaultLanguage, ThemeVariant } from './index'

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

describe('default application language', () => {
  it('uses pt-br when no preference has been saved', () => {
    const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    const setItem = jest.fn()
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: { getItem: jest.fn(() => null), setItem }
      })

      expect(getCurrentLanguage()).toBe('pt-br')
      expect(setItem).toHaveBeenCalledWith('lang', 'pt-br')
    } finally {
      if (previousLocalStorage !== undefined) Object.defineProperty(globalThis, 'localStorage', previousLocalStorage)
      else Reflect.deleteProperty(globalThis, 'localStorage')
    }
  })

  it('sets pt-br when no preference has been saved', () => {
    const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    const setItem = jest.fn()
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: { getItem: jest.fn(() => null), setItem }
      })

      setDefaultLanguage('pt-br')

      expect(setItem).toHaveBeenCalledWith('lang', 'pt-br')
    } finally {
      if (previousLocalStorage !== undefined) Object.defineProperty(globalThis, 'localStorage', previousLocalStorage)
      else Reflect.deleteProperty(globalThis, 'localStorage')
    }
  })

  it('preserves an existing language preference', () => {
    const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    const setItem = jest.fn()
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: { getItem: jest.fn(() => 'en'), setItem }
      })

      setDefaultLanguage('pt-br', ['pt-br', 'en'])

      expect(setItem).not.toHaveBeenCalled()
    } finally {
      if (previousLocalStorage !== undefined) Object.defineProperty(globalThis, 'localStorage', previousLocalStorage)
      else Reflect.deleteProperty(globalThis, 'localStorage')
    }
  })

  it('replaces an unavailable language preference', () => {
    const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    const setItem = jest.fn()
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: { getItem: jest.fn(() => 'en'), setItem }
      })

      setDefaultLanguage('pt-br', ['pt-br'])

      expect(setItem).toHaveBeenCalledWith('lang', 'pt-br')
    } finally {
      if (previousLocalStorage !== undefined) Object.defineProperty(globalThis, 'localStorage', previousLocalStorage)
      else Reflect.deleteProperty(globalThis, 'localStorage')
    }
  })
})
