import { createPulseClient } from '@hcengineering/presentation'
import { showPopup } from '@hcengineering/ui'
import { joinOrCreateMeetingByInvite } from './meetings'
import { responseToInviteRequest, subscribeInviteRequests, type InviteRequest } from './invites'

jest.mock('@hcengineering/core', () => ({ AccountRole: { ReadOnlyGuest: 'readonly' }, getCurrentAccount: () => ({ role: 'user' }) }))
jest.mock('@hcengineering/contact', () => ({ getCurrentEmployee: () => 'recipient' }))
jest.mock('@hcengineering/ui', () => ({ showPopup: jest.fn() }))
jest.mock('@hcengineering/presentation', () => ({
  __esModule: true,
  default: { metadata: { WorkspaceUuid: 'workspace' } },
  createPulseClient: jest.fn()
}))
jest.mock('@hcengineering/platform', () => ({ getMetadata: () => 'workspace' }))
jest.mock('svelte/store', () => ({ get: jest.fn() }))
jest.mock('./stores', () => ({ myInfo: {} }))
jest.mock('@hcengineering/love', () => ({ __esModule: true, default: { ids: { Reception: 'reception' } } }))
jest.mock('./components/meeting/invites/InviteRequestPopup.svelte', () => ({}))
jest.mock('./components/meeting/invites/InviteResponsePopup.svelte', () => ({}))
jest.mock('./meetings', () => ({ joinOrCreateMeetingByInvite: jest.fn() }))

describe('invite acceptance', () => {
  let notify: (key: string, request: InviteRequest | undefined) => void
  const key = 'request'
  const close = jest.fn()
  const put = jest.fn()

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.mocked(showPopup).mockReturnValue({ close, update: jest.fn() } as any)
    jest.mocked(createPulseClient).mockResolvedValue({
      subscribe: jest.fn(async (_prefix: string, callback: typeof notify) => { notify = callback; return jest.fn() }),
      put
    } as any)
    put.mockResolvedValue(undefined)
    await subscribeInviteRequests()
    notify(key, { from: 'sender' as any, meetingId: 'room' })
  })

  test('joins captured room when sender removes request before response finishes', async () => {
    put.mockImplementation(async () => { notify(key, undefined) })
    await responseToInviteRequest(true)
    expect(joinOrCreateMeetingByInvite).toHaveBeenCalledWith('room')
    expect(close).toHaveBeenCalledTimes(1)
    expect(put).toHaveBeenCalledWith('workspace/love/invite/response/sender/recipient/room', {
      accept: true, from: 'recipient', meetingId: 'room'
    }, 2)
  })

  test('preserves next invitation arriving while response is pending', async () => {
    put.mockImplementation(async () => {
      notify(key, undefined)
      notify('next', { from: 'other' as any, meetingId: 'other-room' })
    })
    await responseToInviteRequest(true)
    expect(close).toHaveBeenCalledTimes(1)
    expect(showPopup).toHaveBeenCalledTimes(2)
    expect(joinOrCreateMeetingByInvite).toHaveBeenCalledWith('room')
  })

  test('decline never joins when request disappears during response', async () => {
    put.mockImplementation(async () => { notify(key, undefined) })
    await responseToInviteRequest(false)
    expect(joinOrCreateMeetingByInvite).not.toHaveBeenCalled()
  })
})
