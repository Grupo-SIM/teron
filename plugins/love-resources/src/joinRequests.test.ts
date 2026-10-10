import { createPulseClient } from '@hcengineering/presentation'
import { showPopup } from '@hcengineering/ui'
import { joinOrCreateMeetingByInvite } from './meetings'
import {
  responseToJoinRequest,
  sendJoinRequest,
  subscribeJoinRequests,
  subscribeJoinResponses,
  type JoinRequest,
  type JoinResponse
} from './joinRequests'

jest.mock('@hcengineering/core', () => ({ AccountRole: { ReadOnlyGuest: 'readonly' }, getCurrentAccount: () => ({ role: 'user' }) }))
jest.mock('@hcengineering/contact', () => ({ getCurrentEmployee: () => 'recipient' }))
jest.mock('@hcengineering/ui', () => ({ showPopup: jest.fn(), doNotDisturb: { subscribe: jest.fn(() => jest.fn()) } }))
jest.mock('svelte/store', () => ({ get: () => false }))
jest.mock('@hcengineering/presentation', () => ({
  __esModule: true,
  default: { metadata: { WorkspaceUuid: 'workspace' } },
  createPulseClient: jest.fn()
}))
jest.mock('@hcengineering/platform', () => ({ getMetadata: () => 'workspace' }))
jest.mock('./components/meeting/invites/JoinRequestPopup.svelte', () => ({}))
jest.mock('./components/meeting/invites/JoinResponsePopup.svelte', () => ({}))
jest.mock('./meetings', () => ({ joinOrCreateMeetingByInvite: jest.fn() }))

describe('knock acceptance', () => {
  let notifyRequest: (key: string, request: JoinRequest | undefined) => void
  const request: JoinRequest = { from: 'sender' as any, meetingId: 'room' }
  const close = jest.fn()
  const put = jest.fn()

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.mocked(showPopup).mockReturnValue({ close, update: jest.fn() } as any)
    jest.mocked(createPulseClient).mockResolvedValue({
      subscribe: jest.fn(async (_prefix: string, callback: typeof notifyRequest) => { notifyRequest = callback; return jest.fn() }),
      put
    } as any)
    put.mockResolvedValue(undefined)
    await subscribeJoinRequests('room')
    notifyRequest('request', request)
  })

  test('joins captured room when requester removes knock before response finishes', async () => {
    put.mockImplementation(async () => { notifyRequest('request', undefined) })
    await responseToJoinRequest(request, true)
    expect(joinOrCreateMeetingByInvite).toHaveBeenCalledWith('room')
    expect(close).toHaveBeenCalledTimes(1)
    expect(put).toHaveBeenCalledWith('workspace/love/join/response/sender/room', { accept: true, meetingId: 'room' }, expect.any(Number))
  })

  test('preserves next knock arriving while response is pending', async () => {
    put.mockImplementation(async () => {
      notifyRequest('request', undefined)
      notifyRequest('next', { from: 'other' as any, meetingId: 'room' })
    })
    await responseToJoinRequest(request, true)
    expect(close).toHaveBeenCalledTimes(1)
    expect(showPopup).toHaveBeenCalledTimes(2)
    expect(joinOrCreateMeetingByInvite).toHaveBeenCalledWith('room')
  })

  test('decline never joins when knock disappears during response', async () => {
    put.mockImplementation(async () => { notifyRequest('request', undefined) })
    await responseToJoinRequest(request, false)
    expect(joinOrCreateMeetingByInvite).not.toHaveBeenCalled()
  })
})

describe('knock response delivery', () => {
  let notifyResponse: (key: string, response: JoinResponse | undefined) => void
  const close = jest.fn()
  const remove = jest.fn()
  const response = { accept: true, meetingId: 'room' }

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.mocked(showPopup).mockReturnValue({ close, update: jest.fn() } as any)
    jest.mocked(createPulseClient).mockResolvedValue({
      subscribe: jest.fn(async (_prefix: string, callback: typeof notifyResponse) => { notifyResponse = callback; return jest.fn() }),
      delete: remove
    } as any)
    remove.mockResolvedValue(undefined)
    await subscribeJoinResponses()
    sendJoinRequest('room')
  })

  async function settleResponse (): Promise<void> {
    // Subscription dispatch deliberately starts an async handler without awaiting it.
    await new Promise<void>((resolve) => { setImmediate(resolve) })
  }

  test('duplicate accepted notifications join only once', async () => {
    notifyResponse('response', response)
    notifyResponse('response', response)
    await settleResponse()
    expect(joinOrCreateMeetingByInvite).toHaveBeenCalledTimes(1)
    expect(joinOrCreateMeetingByInvite).toHaveBeenCalledWith('room')
    expect(close).toHaveBeenCalledTimes(1)
  })

  test('failed pulse cleanup does not prevent accepted caller from joining', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    remove.mockRejectedValue(new Error('pulse unavailable'))
    try {
      notifyResponse('response', response)
      await settleResponse()
      expect(close).toHaveBeenCalledTimes(1)
      expect(joinOrCreateMeetingByInvite).toHaveBeenCalledWith('room')
    } finally {
      warn.mockRestore()
    }
  })

  test('response for another room leaves pending knock open', async () => {
    notifyResponse('response', { accept: true, meetingId: 'other-room' })
    await settleResponse()
    expect(close).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect(joinOrCreateMeetingByInvite).not.toHaveBeenCalled()
  })
})
