import { HulypulseClient } from '@hcengineering/hulypulse-client'
import { getMetadata } from '@hcengineering/platform'
import presentation from './plugin'
import { closePulseClient, createPulseClient } from './pulse'

jest.mock('@hcengineering/hulypulse-client', () => ({ HulypulseClient: { connect: jest.fn() } }))
jest.mock('@hcengineering/platform', () => ({ getMetadata: jest.fn() }))
jest.mock('./plugin', () => ({
  __esModule: true,
  default: { metadata: { PulseUrl: 'url', Token: 'token', WorkspaceUuid: 'workspace' } }
}))

const connect = HulypulseClient.connect as jest.Mock
const metadata = new Map<string, string>()

beforeEach(() => {
  closePulseClient()
  connect.mockReset()
  metadata.set(presentation.metadata.PulseUrl, 'ws://localhost/ws')
  metadata.set(presentation.metadata.Token, 'token')
  metadata.set(presentation.metadata.WorkspaceUuid, 'workspace')
  ;(getMetadata as jest.Mock).mockImplementation((key: string) => metadata.get(key))
})

afterEach(() => closePulseClient())

test('retries a failed Pulse connection instead of caching unavailable invitations', async () => {
  const client = { close: jest.fn() }
  connect.mockRejectedValueOnce(new Error('temporarily unavailable')).mockResolvedValueOnce(client)
  expect(await createPulseClient()).toBeUndefined()
  expect(await createPulseClient()).toBe(client)
  expect(connect).toHaveBeenCalledTimes(2)
})

test('shares a pending connection between invitation subscribers', async () => {
  const client = { close: jest.fn() }
  connect.mockResolvedValue(client)
  const results = await Promise.all([createPulseClient(), createPulseClient()])
  expect(results).toEqual([client, client])
  expect(connect).toHaveBeenCalledTimes(1)
})

test('a failed old connection does not clear a newer workspace connection', async () => {
  let rejectOld: (error: Error) => void = () => {}
  const client = { close: jest.fn() }
  connect.mockImplementationOnce(async () => await new Promise((_resolve, reject) => { rejectOld = reject }))
    .mockResolvedValueOnce(client)
  const old = createPulseClient()
  metadata.set(presentation.metadata.WorkspaceUuid, 'other-workspace')
  expect(await createPulseClient()).toBe(client)
  rejectOld(new Error('old connection failed'))
  await old
  expect(await createPulseClient()).toBe(client)
  expect(connect).toHaveBeenCalledTimes(2)
})

test('reconnects when the configured Pulse endpoint changes', async () => {
  const old = { close: jest.fn() }
  const current = { close: jest.fn() }
  connect.mockResolvedValueOnce(old).mockResolvedValueOnce(current)
  await createPulseClient()
  metadata.set(presentation.metadata.PulseUrl, 'ws://localhost/other')
  expect(await createPulseClient()).toBe(current)
  expect(old.close).toHaveBeenCalledTimes(1)
  expect(connect).toHaveBeenLastCalledWith('ws://localhost/other?token=token')
})
