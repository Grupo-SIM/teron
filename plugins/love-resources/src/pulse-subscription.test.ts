import { createPulseClient } from '@hcengineering/presentation'
import { PulseSubscription } from './pulse-subscription'

jest.mock('@hcengineering/presentation', () => ({ createPulseClient: jest.fn() }))

const create = jest.mocked(createPulseClient)
let subscription: PulseSubscription

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  subscription = new PulseSubscription()
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(async () => {
  await subscription.stop()
  jest.useRealTimers()
  jest.restoreAllMocks()
})

test('retries missing configuration and transient subscription failures', async () => {
  const subscribe = jest.fn().mockRejectedValueOnce(new Error('disconnected')).mockResolvedValue(jest.fn())
  create.mockResolvedValueOnce(undefined).mockResolvedValue({ subscribe, refresh: jest.fn().mockResolvedValue(undefined) } as any)
  const notify = jest.fn()
  await subscription.start('room/', notify)
  await jest.advanceTimersByTimeAsync(1000)
  await jest.advanceTimersByTimeAsync(1000)
  expect(subscribe).toHaveBeenCalledTimes(2)
  subscribe.mock.calls[1][1]('room/request', { from: 'sender' })
  expect(notify).toHaveBeenCalledWith('room/request', { from: 'sender' })
})

test('stop cancels retries', async () => {
  create.mockResolvedValue(undefined)
  await subscription.start('room/', jest.fn())
  await subscription.stop()
  await jest.advanceTimersByTimeAsync(5000)
  expect(create).toHaveBeenCalledTimes(1)
})

test('late room subscription cannot deliver notifications after switching rooms', async () => {
  let resolveOld!: (unsubscribe: any) => void
  const unsubscribeOld = jest.fn()
  const subscribe = jest.fn().mockImplementationOnce(async () => await new Promise((resolve) => { resolveOld = resolve }))
    .mockResolvedValue(jest.fn())
  create.mockResolvedValue({ subscribe, refresh: jest.fn().mockResolvedValue(undefined) } as any)
  const oldNotify = jest.fn()
  const old = subscription.start('old/', oldNotify)
  await jest.advanceTimersByTimeAsync(0)
  const notify = jest.fn()
  await subscription.start('new/', notify)
  subscribe.mock.calls[0][1]('old/request', {})
  resolveOld(unsubscribeOld)
  await old
  expect(unsubscribeOld).toHaveBeenCalledTimes(1)
  expect(oldNotify).not.toHaveBeenCalled()
  subscribe.mock.calls[1][1]('new/request', {})
  expect(notify).toHaveBeenCalledTimes(1)
})

test('recovers missed requests, short-lived responses and removals from snapshots', async () => {
  const refresh = jest.fn().mockImplementationOnce(async (_key, callback) => { callback('room/request', { accept: true }) })
    .mockResolvedValue(undefined)
  create.mockResolvedValue({ subscribe: jest.fn().mockResolvedValue(jest.fn()), refresh } as any)
  const notify = jest.fn()
  await subscription.start('room/', notify)
  await jest.advanceTimersByTimeAsync(500)
  expect(notify).toHaveBeenCalledWith('room/request', { accept: true })
  await jest.advanceTimersByTimeAsync(500)
  expect(notify).toHaveBeenLastCalledWith('room/request', undefined)
})
