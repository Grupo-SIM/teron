import { strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'

// Evaluate the real identifier declarations without loading UI/DB dependencies.
// This exercises the same mergeIds path used when bundling backend models.
const platformSource = readFileSync(
  new URL('../../../foundations/core/packages/platform/src/platform.ts', import.meta.url), 'utf8'
)
const identifierSource = platformSource.slice(
  platformSource.indexOf('export const _ID_SEPARATOR'),
  platformSource.indexOf('export const platformId')
).replace(/^export /gm, '')
const { plugin, mergeIds } = new Function(
  `${stripTypeScriptTypes(identifierSource)}\nreturn { plugin, mergeIds }`
)()

const contactSource = readFileSync(new URL('../../contact/src/index.ts', import.meta.url), 'utf8')
const contactDeclaration = contactSource.slice(
  contactSource.indexOf('export const contactPlugin ='),
  contactSource.indexOf('export default contactPlugin')
).replace('export const contactPlugin =', 'const contactPlugin =')
const resourceSource = readFileSync(new URL('./plugin.ts', import.meta.url), 'utf8')
const resourceDeclaration = resourceSource.slice(resourceSource.indexOf('export default mergeIds'))
  .replace('export default', 'const resources =')

test('contact resources register without overwriting shared identifiers', () => {
  const contact = new Function('plugin', 'contactId', `${stripTypeScriptTypes(contactDeclaration)}\nreturn contactPlugin`)(plugin, 'contact')
  const resources = new Function('mergeIds', 'contactId', 'contact', `${stripTypeScriptTypes(resourceDeclaration)}\nreturn resources`)(
    mergeIds, 'contact', contact
  )
  strictEqual(resources.string.RemoteDaysPerWeekShort, 'contact:string:RemoteDaysPerWeekShort')
  strictEqual(resources.string.OnsiteDaysPerWeekShort, 'contact:string:OnsiteDaysPerWeekShort')
  strictEqual(resources.string.RemoteDaysPerWeek, 'contact:string:RemoteDaysPerWeek')
  strictEqual(resources.string.OnsiteDaysPerWeek, 'contact:string:OnsiteDaysPerWeek')
})
