import type { IntlString, Plugin } from './platform'
import { addStringsLoader, loadPluginStrings, translate, translateCB } from './i18n'

function translateLabel (message: IntlString, locale = 'pt-br'): Promise<string> {
  return new Promise((resolve) => {
    translateCB(message, {}, locale, resolve, true)
  })
}

describe('translation loading', () => {
  it('shares a pending locale request across labels and preloading', async () => {
    const plugin = 'concurrent-labels' as Plugin
    let finish: (messages: Record<string, Record<string, string>>) => void = () => {}
    const loader = jest.fn(async () => await new Promise<Record<string, Record<string, string>>>((resolve) => {
      finish = resolve
    }))
    addStringsLoader(plugin, loader)

    const menu = translateLabel(`${plugin}:string:HideMenu` as IntlString)
    const documents = translateLabel(`${plugin}:string:DocumentApplication` as IntlString)
    const preload = loadPluginStrings('pt-br')
    expect(loader).toHaveBeenCalledTimes(1)

    finish({ string: { HideMenu: 'Ocultar Menu', DocumentApplication: 'Diretrizes' } })
    expect(await menu).toBe('Ocultar Menu')
    expect(await documents).toBe('Diretrizes')
    await preload
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('retries after locale and English chunks both fail', async () => {
    const plugin = 'transient-labels' as Plugin
    const message = `${plugin}:string:HideMenu` as IntlString
    let offline = true
    const loader = jest.fn(async () => {
      if (offline) throw new Error('Chunk temporarily unavailable')
      return { string: { HideMenu: 'Ocultar Menu' } }
    })
    addStringsLoader(plugin, loader)
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(await translateLabel(message)).toBe(message)
      offline = false
      expect(await translateLabel(message)).toBe('Ocultar Menu')
      expect(await translate(message, {}, 'pt-br')).toBe('Ocultar Menu')
      expect(loader).toHaveBeenCalledTimes(3)
    } finally {
      consoleError.mockRestore()
    }
  })

  it('recovers when a loader is registered after an early translation request', async () => {
    const plugin = 'late-labels' as Plugin
    const message = `${plugin}:string:DocumentApplication` as IntlString
    expect(await translateLabel(message)).toBe(message)
    addStringsLoader(plugin, async () => ({ string: { DocumentApplication: 'Diretrizes' } }))
    expect(await translateLabel(message)).toBe('Diretrizes')
  })

  it('retries an English fallback after its chunk fails', async () => {
    const plugin = 'transient-fallback' as Plugin
    const message = `${plugin}:string:Missing` as IntlString
    let offline = true
    addStringsLoader(plugin, async (locale): Promise<Record<string, Record<string, string>>> => {
      if (locale === 'pt-br') return { string: {} }
      if (offline) throw new Error('English chunk temporarily unavailable')
      return { string: { Missing: 'Fallback text' } }
    })
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(await translateLabel(message)).toBe(message)
      offline = false
      expect(await translateLabel(message)).toBe('Fallback text')
    } finally {
      consoleError.mockRestore()
    }
  })
})
