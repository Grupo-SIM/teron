jest.mock('@hcengineering/ui', () => {
  let value = false
  const subscribers = new Set<(value: boolean) => void>()
  return {
    doNotDisturb: {
      set: (next: boolean) => {
        value = next
        subscribers.forEach((subscriber) => { subscriber(value) })
      },
      subscribe: (subscriber: (value: boolean) => void) => {
        subscribers.add(subscriber)
        subscriber(value)
        return () => subscribers.delete(subscriber)
      }
    }
  }
})
jest.mock('svelte/store', () => ({
  get: (store: { subscribe: (subscriber: (value: boolean) => void) => () => void }) => {
    let result = false
    store.subscribe((value) => { result = value })()
    return result
  }
}))
jest.mock('@hcengineering/platform', () => ({ getMetadata: jest.fn(() => '/sound.wav'), getResource: jest.fn() }))
jest.mock('@hcengineering/notification', () => ({ __esModule: true, default: {} }))
jest.mock('.', () => ({ getClient: jest.fn() }))

const mockSource = {
  buffer: undefined,
  loop: false,
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  disconnect: jest.fn(),
  onended: undefined
}
const mockContext = {
  state: 'suspended',
  resume: jest.fn(),
  decodeAudioData: jest.fn().mockResolvedValue({}),
  createBufferSource: jest.fn(() => mockSource),
  destination: {}
}
const listeners = new Map<string, () => void>()
Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: jest.fn(() => mockContext) })
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: { addEventListener: (event: string, listener: () => void) => listeners.set(event, listener) }
})
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  value: jest.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(0) })
})

// Load after browser mocks: the shared context is created at module startup.
const { playSound } = require('./sound') as typeof import('./sound')
const { doNotDisturb } = require('@hcengineering/ui') as { doNotDisturb: { set: (value: boolean) => void } }

beforeEach(() => {
  jest.clearAllMocks()
  mockContext.state = 'suspended'
  mockContext.resume.mockResolvedValue(undefined)
  doNotDisturb.set(false)
})

test.each(['pointerdown', 'keydown'])('resumes suspended audio on %s', (event) => {
  listeners.get(event)?.()
  expect(mockContext.resume).toHaveBeenCalledTimes(1)
})

test('playback resumes audio and returns a stop handle even while resume remains pending', async () => {
  mockContext.resume.mockReturnValue(new Promise(() => {}))
  const stop = await playSound('knock', true)
  expect(mockContext.resume).toHaveBeenCalledTimes(1)
  expect(mockSource.loop).toBe(true)
  expect(mockSource.start).toHaveBeenCalledTimes(1)
  stop?.()
  stop?.()
  expect(mockSource.stop).toHaveBeenCalledTimes(1)
  expect(mockSource.disconnect).toHaveBeenCalledTimes(1)
})

test('does not resume already running audio', async () => {
  mockContext.state = 'running'
  listeners.get('pointerdown')?.()
  const stop = await playSound('knock')
  expect(mockContext.resume).not.toHaveBeenCalled()
  stop?.()
})

test('do not disturb stops a loop and suppresses further playback', async () => {
  const stop = await playSound('knock', true)
  doNotDisturb.set(true)
  expect(mockSource.stop).toHaveBeenCalledTimes(1)
  stop?.()
  expect(await playSound('knock', true)).toBeNull()
  expect(mockSource.start).toHaveBeenCalledTimes(1)
})

test('resume rejection is handled without losing the stop handle', async () => {
  const error = new Error('autoplay denied')
  mockContext.resume.mockRejectedValue(error)
  const log = jest.spyOn(console, 'error').mockImplementation(() => {})
  const stop = await playSound('knock')
  expect(log).toHaveBeenCalledWith('Cannot resume audio', error)
  expect(stop).toBeInstanceOf(Function)
  stop?.()
  log.mockRestore()
})
