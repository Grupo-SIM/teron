import { strictEqual, rejects } from 'node:assert'
import { afterEach, beforeEach, test } from 'node:test'
import { loadPlugin } from './load-plugin'

let reloads = 0
const values = new Map<string, string>()
const originalLocation = globalThis.location
const originalStorage = globalThis.sessionStorage

beforeEach(() => {
  reloads = 0
  values.clear()
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { reload: () => { reloads++ } } })
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }
  })
})

afterEach(() => {
  Object.defineProperty(globalThis, 'location', { configurable: true, value: originalLocation })
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: originalStorage })
})

test('preserves runtime import errors without reloading the page', async () => {
  const error = new TypeError('e.default is not a function')
  let attempts = 0
  await rejects(loadPlugin(async () => { attempts++; throw error }), (actual) => actual === error)
  strictEqual(attempts, 1)
  strictEqual(reloads, 0)
})

test('returns the module when a transient chunk failure recovers', async () => {
  const module = { default: async () => ({}) }
  let attempts = 0
  strictEqual(await loadPlugin(async () => {
    if (++attempts < 3) throw new Error('Loading chunk 14214 failed')
    return module
  }), module)
  strictEqual(attempts, 3)
  strictEqual(reloads, 0)
})

test('reloads only once across page loads for the same persistent chunk failure', async () => {
  const error = new Error('Loading chunk 14214 failed')
  const loader = async () => { throw error }
  await rejects(loadPlugin(loader), (actual) => actual === error)
  await rejects(loadPlugin(loader), (actual) => actual === error)
  strictEqual(reloads, 1)
})

test('does not reload when session storage is blocked', async () => {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    get: () => { throw new Error('Storage blocked') }
  })
  const error = new Error('Loading chunk 14214 failed')
  await rejects(loadPlugin(async () => { throw error }), (actual) => actual === error)
  strictEqual(reloads, 0)
})

test('preserves rejection values that are not Error objects', async () => {
  await rejects(loadPlugin(async () => { throw null }), (actual) => actual === null)
  strictEqual(reloads, 0)
})
