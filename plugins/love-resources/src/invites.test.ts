import { type Writable } from 'svelte/store'
import { currentRoom } from './stores'
import { RoomAccess } from '@hcengineering/love'
import { createPulseClient } from '@hcengineering/presentation'
import { doNotDisturb, showPopup } from '@hcengineering/ui'
import { joinOrCreateMeetingByInvite } from './meetings'
import { responseToInviteRequest, subscribeInviteRequests, type InviteRequest } from './invites'

jest.mock('svelte/store', () => jest.requireActual('./tests/notification-store'))
jest.mock('@hcengineering/core', () => ({ AccountRole: { ReadOnlyGuest: 'readonly' }, getCurrentAccount: () => ({ role: 'user' }) }))
jest.mock('@hcengineering/contact', () => ({ getCurrentEmployee: () => 'recipient' }))
jest.mock('@hcengineering/ui', () => ({ showPopup: jest.fn(), doNotDisturb: jest.requireActual('./tests/notification-store').writable(false) }))
jest.mock('@hcengineering/presentation', () => ({
  __esModule: true,
  default: { metadata: { WorkspaceUuid: 'workspace' } },
  createPulseClient: jest.fn()
}))
jest.mock('@hcengineering/platform', () => ({ getMetadata: () => 'workspace' }))
jest.mock('./components/meeting/invites/InviteRequestPopup.svelte', () => ({}))
jest.mock('./components/meeting/invites/InviteResponsePopup.svelte', () => ({}))
jest.mock('./meetings', () => ({ joinOrCreateMeetingByInvite: jest.fn() }))

jest.mock('./stores', () => ({ myInfo: {}, currentRoom: jest.requireActual('./tests/notification-store').writable(undefined) }))
jest.mock('@hcengineering/love', () => ({ __esModule: true, default: { ids: { Reception: 'reception' } }, RoomAccess: { DND: 'dnd', Open: 'open' } }))

const mockCurrentRoom = currentRoom as Writable<any>

describe('invite acceptance', () => {
  let notify: (key: string, request: InviteRequest | undefined) => void
  const key = 'request'
  const close = jest.fn()
  const put = jest.fn()

  beforeEach(async () => {
    mockCurrentRoom.set(undefined)
    doNotDisturb.set(false)
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

  test('room DND closes ringing and ignores calls until occupant leaves protected room', () => {
    mockCurrentRoom.set({ _id: 'protected-room', access: RoomAccess.DND } as any)
    expect(close).toHaveBeenCalledTimes(1)
    jest.mocked(showPopup).mockClear()
    notify('muted', { from: 'other' as any, meetingId: 'outside-room' })
    expect(showPopup).not.toHaveBeenCalled()
    mockCurrentRoom.set(undefined)
    notify('fresh', { from: 'other' as any, meetingId: 'new-room' })
    expect(showPopup).toHaveBeenCalledTimes(1)
    expect(jest.mocked(showPopup).mock.calls[0][1]).toEqual({ invite: { from: 'other', meetingId: 'new-room' } })
    notify('fresh', undefined)
  })

  test('personal DND remains active when room DND ends', () => {
    mockCurrentRoom.set({ _id: 'protected-room', access: RoomAccess.DND } as any)
    doNotDisturb.set(true)
    mockCurrentRoom.set(undefined)
    jest.mocked(showPopup).mockClear()
    notify('still-muted', { from: 'other' as any, meetingId: 'outside-room' })
    expect(showPopup).not.toHaveBeenCalled()
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
  test('suppresses incoming calls until Do Not Disturb is disabled', () => {
    doNotDisturb.set(true)
    jest.mocked(showPopup).mockClear()
    notify('muted', { from: 'other' as any, meetingId: 'muted-room' })
    expect(showPopup).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
    doNotDisturb.set(false)
    notify('new', { from: 'other' as any, meetingId: 'new-room' })
    expect(showPopup).toHaveBeenCalledTimes(1)
    expect(jest.mocked(showPopup).mock.calls[0][1]).toEqual({ invite: { from: 'other', meetingId: 'new-room' } })
  })

})
