import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import platform, { platformId } from './platform'
import { addStringsLoader, translate } from './i18n'

const locales = join(__dirname, '../lang')
addStringsLoader(platformId, async (locale) => JSON.parse(readFileSync(join(locales, `${locale}.json`), 'utf8')))

describe('frontend error localization', () => {
  it.each(readdirSync(locales).filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -5)))(
    'hides untranslatable technical error details in %s', async (locale) => {
      const details = 'Member is not authorized to change workspace structure or this document.'
      const messages = JSON.parse(readFileSync(join(locales, `${locale}.json`), 'utf8'))
      const translated = await translate(platform.status.UnknownError, { message: details }, locale)
      expect(translated).toBe(messages.status.UnknownError)
      expect(translated).not.toContain(details)
      expect(await translate(platform.status.Forbidden, {}, locale)).toBe(messages.status.Forbidden)
    }
  )
})
