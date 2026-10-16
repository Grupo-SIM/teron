import { EventEmitter } from 'events'
import { ConnectionState, DisconnectReason, RoomEvent } from 'livekit-client'

jest.mock('livekit-client', () => {
  const actual = jest.requireActual('livekit-client')
  const { EventEmitter } = jest.requireActual('events')
  return {
    ...actual,
    Room: class extends EventEmitter {
      state = actual.ConnectionState.Disconnected
      remoteParticipants = new Map()
      localParticipant = {
        getTrackPublication: jest.fn(() => undefined),
        publishTrack: jest.fn(async () => {}),
        setCameraEnabled: jest.fn(async () => {}),
        setMicrophoneEnabled: jest.fn(async () => {}),
        setScreenShareEnabled: jest.fn(async () => {})
      }

      connect = jest.fn(async () => {
        this.state = actual.ConnectionState.Connected
        this.emit(actual.RoomEvent.Connected)
      })

      disconnect = jest.fn(async () => {
        this.state = actual.ConnectionState.Disconnected
        this.emit(actual.RoomEvent.Disconnected, actual.DisconnectReason.CLIENT_INITIATED)
      })

      switchActiveDevice = jest.fn(async () => {})
    }
  }
})
jest.mock('svelte/store', () => ({ writable: () => ({ set: jest.fn() }) }))
jest.mock('@hcengineering/platform', () => ({ translate: jest.fn() }))
jest.mock('@hcengineering/media', () => ({ getMediaDevices: jest.fn(), getSelectedSpeakerId: () => undefined }))
jest.mock('@hcengineering/love', () => ({ LoveEvents: { DisconnectedFromRoom: 'disconnected' } }))
jest.mock('@hcengineering/media-resources', () => ({ useMedia: jest.fn() }))
jest.mock('@hcengineering/analytics', () => ({ Analytics: { handleEvent: jest.fn() } }))
jest.mock('@hcengineering/ui', () => ({ addNotification: jest.fn(), NotificationSeverity: {} }))
jest.mock('@hcengineering/theme', () => ({ getCurrentLanguage: jest.fn() }))
jest.mock('./components/meeting/LastParticipantNotification.svelte', () => ({}))
jest.mock('./plugin', () => ({}))
jest.mock('./stores', () => ({ $myPreferences: { camEnabled: true, micEnabled: true } }))
jest.mock('./meetings', () => ({ leaveMeeting: jest.fn() }))

import { useMedia } from '@hcengineering/media-resources'
import { LiveKitClient, screenSharingState, ScreenSharingState } from './liveKitClient'

class MockSession extends EventEmitter {
  state = { camera: { enabled: true, deviceId: 'camera' }, microphone: { enabled: true, deviceId: 'mic' } }
  close = jest.fn()
  setFeature = jest.fn()
  setCamera = jest.fn()
  setMicrophone = jest.fn()
}

const flush = async (): Promise<void> => { for (let i = 0; i < 12; i++) await Promise.resolve() }

describe('LiveKit terminal disconnection recovery', () => {
  let client: LiveKitClient
  let session: MockSession
  let refreshToken: jest.Mock

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(globalThis as any).window = globalThis
    session = new MockSession()
    ;(useMedia as jest.Mock).mockResolvedValue(session)
    refreshToken = jest.fn().mockResolvedValue('fresh-token')
    client = new LiveKitClient()
    await client.connect('wss://meeting', 'initial-token', true, refreshToken)
  })

  afterEach(async () => {
    client.cancelRecovery()
    await flush()
    jest.useRealTimers()
  })

  const loseConnection = (reason: DisconnectReason): void => {
    ;(client.liveKitRoom as any).state = ConnectionState.Disconnected
    client.liveKitRoom.emit(RoomEvent.Disconnected, reason)
  }

  test('STATE_MISMATCH refreshes token for same room and restores desired camera and microphone', async () => {
    await client.setMicrophoneEnabled(false)
    client.onLocalTrackUnpublished({ track: { kind: 'video', source: 'camera' } } as any, {} as any)
    client.onLocalTrackUnpublished({ track: { kind: 'audio', source: 'microphone' } } as any, {} as any)
    expect(session.setCamera).not.toHaveBeenCalled()
    expect(session.setMicrophone).not.toHaveBeenCalled()
    loseConnection(DisconnectReason.STATE_MISMATCH)
    expect(session.close).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(300)
    await flush()
    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(client.liveKitRoom.connect).toHaveBeenLastCalledWith('wss://meeting', 'fresh-token', expect.any(Object))
    expect(client.liveKitRoom.localParticipant.setCameraEnabled).toHaveBeenLastCalledWith(true)
    expect(client.liveKitRoom.localParticipant.setMicrophoneEnabled).toHaveBeenLastCalledWith(false)
    expect(client.liveKitRoom.listenerCount(RoomEvent.LocalTrackPublished)).toBe(1)
    expect(client.isConnecting).toBe(false)
    loseConnection(DisconnectReason.STATE_MISMATCH)
    await jest.advanceTimersByTimeAsync(300)
    expect(client.liveKitRoom.listenerCount(RoomEvent.LocalTrackPublished)).toBe(1)
  })

  test.each([RoomEvent.Connected, RoomEvent.Reconnected])(
    'views waiting during a network outage resume on %s without leaking listeners', async (event) => {
      ;(client.liveKitRoom as any).state = ConnectionState.SignalReconnecting
      client.liveKitRoom.emit(RoomEvent.SignalReconnecting)
      const connectedListeners = client.liveKitRoom.listenerCount(RoomEvent.Connected)
      const reconnectedListeners = client.liveKitRoom.listenerCount(RoomEvent.Reconnected)
      const ready = jest.fn()
      const waiting = client.awaitConnect().then(ready)
      await flush()
      expect(ready).not.toHaveBeenCalled()
      ;(client.liveKitRoom as any).state = ConnectionState.Connected
      client.liveKitRoom.emit(event)
      await waiting
      expect(ready).toHaveBeenCalledTimes(1)
      expect(client.liveKitRoom.listenerCount(RoomEvent.Connected)).toBe(connectedListeners)
      expect(client.liveKitRoom.listenerCount(RoomEvent.Reconnected)).toBe(reconnectedListeners)
    }
  )

  test.each([DisconnectReason.PARTICIPANT_REMOVED, DisconnectReason.DUPLICATE_IDENTITY, DisconnectReason.ROOM_DELETED])(
    'does not reconnect after terminal reason %s', async (reason) => {
      loseConnection(reason)
      await jest.advanceTimersByTimeAsync(60000)
      expect(refreshToken).not.toHaveBeenCalled()
      expect(session.close).toHaveBeenCalled()
    }
  )

  const publishScreen = (source = 'screen_share'): any => {
    const capture: any = { readyState: 'live', stop: jest.fn(), clone: jest.fn(), addEventListener: jest.fn() }
    const republished = { stop: jest.fn() }
    capture.clone.mockReturnValue(republished)
    const original = { getSettings: () => ({}), clone: jest.fn(() => capture) }
    client.onLocalTrackPublished({ track: {
      kind: source === 'screen_share' ? 'video' : 'audio', source, mediaStreamTrack: original
    } } as any, {} as any)
    return { capture, republished }
  }

  test('fresh join republishes live screen and audio capture without requesting display permission', async () => {
    const video = publishScreen()
    const audio = publishScreen('screen_share_audio')
    expect(session.setMicrophone).not.toHaveBeenCalled()
    loseConnection(DisconnectReason.STATE_MISMATCH)
    await jest.advanceTimersByTimeAsync(300)
    expect(client.liveKitRoom.localParticipant.publishTrack).toHaveBeenCalledWith(video.republished, { source: 'screen_share' })
    expect(client.liveKitRoom.localParticipant.publishTrack).toHaveBeenCalledWith(audio.republished, { source: 'screen_share_audio' })
    expect(client.liveKitRoom.localParticipant.setScreenShareEnabled).not.toHaveBeenCalled()
    expect(video.capture.stop).not.toHaveBeenCalled()
    await client.disconnect()
    expect(video.capture.stop).toHaveBeenCalledTimes(1)
    expect(audio.capture.stop).toHaveBeenCalledTimes(1)
  })

  test('screen publication failure retries without abandoning live capture', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    const video = publishScreen()
    ;(client.liveKitRoom.localParticipant.publishTrack as jest.Mock).mockRejectedValueOnce(new Error('publish failed'))
    loseConnection(DisconnectReason.STATE_MISMATCH)
    await jest.advanceTimersByTimeAsync(300)
    expect(video.republished.stop).toHaveBeenCalled()
    expect(video.capture.stop).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1000)
    expect(client.liveKitRoom.localParticipant.publishTrack).toHaveBeenCalledTimes(2)
    log.mockRestore()
  })

  test('stopping sharing during outage releases capture and prevents restoration', async () => {
    const video = publishScreen()
    loseConnection(DisconnectReason.STATE_MISMATCH)
    await client.setScreenShareEnabled(false)
    await jest.advanceTimersByTimeAsync(300)
    expect(video.capture.stop).toHaveBeenCalledTimes(1)
    expect(client.liveKitRoom.localParticipant.publishTrack).not.toHaveBeenCalled()
  })

  test('ended capture is cleared instead of prompting again after recovery', async () => {
    const video = publishScreen()
    video.capture.readyState = 'ended'
    loseConnection(DisconnectReason.STATE_MISMATCH)
    await jest.advanceTimersByTimeAsync(300)
    expect(client.liveKitRoom.localParticipant.publishTrack).not.toHaveBeenCalled()
    expect(session.setFeature).toHaveBeenLastCalledWith('sharing', { enabled: false })
  })

  test('capture ending clears local sharing and disables SDK sharing', async () => {
    const { capture } = publishScreen()
    capture.addEventListener.mock.calls[0][1]()
    await flush()
    expect(capture.stop).toHaveBeenCalledTimes(1)
    expect(session.setFeature).toHaveBeenLastCalledWith('sharing', { enabled: false })
    expect(client.liveKitRoom.localParticipant.setScreenShareEnabled).toHaveBeenLastCalledWith(false, { audio: false })
  })

  test('reconciles surviving, muted, ended and unsubscribed remote shares', () => {
    const publication = (): any => ({
      kind: 'video', isMuted: false, track: { mediaStreamTrack: { readyState: 'live' } }
    })
    const first = publication()
    const second = publication()
    const participant = (pub: any): any => ({ getTrackPublication: () => pub })
    client.liveKitRoom.remoteParticipants.set('first', participant(first))
    client.liveKitRoom.remoteParticipants.set('second', participant(second))
    client.onTrackSubscribed({} as any, first, {} as any)
    expect(screenSharingState.set).toHaveBeenLastCalledWith(ScreenSharingState.Remote)
    client.onTrackUnsubscribed(first.track, first, {} as any)
    expect(screenSharingState.set).toHaveBeenLastCalledWith(ScreenSharingState.Remote)
    first.track = undefined
    second.isMuted = true
    client.onTrackMuted(second, { isLocal: false } as any)
    expect(screenSharingState.set).toHaveBeenLastCalledWith(ScreenSharingState.Inactive)
    second.isMuted = false
    client.onTrackUnmuted(second, { isLocal: false } as any)
    expect(screenSharingState.set).toHaveBeenLastCalledWith(ScreenSharingState.Remote)
    client.onTrackUnsubscribed(second.track, second, {} as any)
    expect(screenSharingState.set).toHaveBeenLastCalledWith(ScreenSharingState.Inactive)
    second.track.mediaStreamTrack.readyState = 'ended'
    client.onReconnected()
    expect(screenSharingState.set).toHaveBeenLastCalledWith(ScreenSharingState.Inactive)
  })

  test('participant departure removes the last remote share', () => {
    const publication: any = { kind: 'video', isMuted: false, track: { mediaStreamTrack: { readyState: 'live' } } }
    client.liveKitRoom.remoteParticipants.set('remote', { getTrackPublication: () => publication } as any)
    client.onReconnected()
    expect(screenSharingState.set).toHaveBeenLastCalledWith(ScreenSharingState.Remote)
    client.liveKitRoom.remoteParticipants.clear()
    client.onParticipantDisconnected({} as any)
    expect(screenSharingState.set).toHaveBeenLastCalledWith(ScreenSharingState.Inactive)
  })

  test('explicit disconnect cancels scheduled recovery', async () => {
    loseConnection(DisconnectReason.STATE_MISMATCH)
    await client.disconnect()
    await jest.advanceTimersByTimeAsync(60000)
    expect(refreshToken).not.toHaveBeenCalled()
    expect(client.liveKitRoom.disconnect).toHaveBeenCalledTimes(1)
  })

  test('another terminal disconnect during device restoration keeps recovery alive', async () => {
    const switchDevice = client.liveKitRoom.switchActiveDevice as jest.Mock
    switchDevice.mockImplementationOnce(async () => {
      loseConnection(DisconnectReason.STATE_MISMATCH)
    })
    loseConnection(DisconnectReason.STATE_MISMATCH)
    await jest.advanceTimersByTimeAsync(300)
    await flush()
    expect(refreshToken).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1000)
    await flush()
    expect(refreshToken).toHaveBeenCalledTimes(2)
    expect(client.liveKitRoom.state).toBe(ConnectionState.Connected)
    expect(client.liveKitRoom.localParticipant.setMicrophoneEnabled).toHaveBeenLastCalledWith(true)
  })

  test('explicit disconnect prevents reconnect after pending token refresh resolves', async () => {
    let resolveToken: (token: string) => void = () => {}
    refreshToken.mockImplementation(async () => await new Promise<string>((resolve) => { resolveToken = resolve }))
    loseConnection(DisconnectReason.STATE_MISMATCH)
    await jest.advanceTimersByTimeAsync(300)
    const disconnect = client.disconnect()
    resolveToken('late-token')
    await disconnect
    expect(client.liveKitRoom.connect).toHaveBeenCalledTimes(1)
  })

  test('new room waits for stale recovery and uses its own token', async () => {
    let resolveToken: (token: string) => void = () => {}
    refreshToken.mockImplementation(async () => await new Promise<string>((resolve) => { resolveToken = resolve }))
    loseConnection(DisconnectReason.STATE_MISMATCH)
    await jest.advanceTimersByTimeAsync(300)
    const join = client.connect('wss://new-room', 'new-room-token', true, jest.fn())
    resolveToken('stale-token')
    await join
    expect(client.liveKitRoom.connect).toHaveBeenCalledTimes(2)
    expect(client.liveKitRoom.connect).toHaveBeenLastCalledWith('wss://new-room', 'new-room-token', expect.any(Object))
    expect(client.liveKitRoom.disconnect).not.toHaveBeenCalled()
  })

  test('failed refresh retries with backoff and cancellation stops retries', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    refreshToken.mockRejectedValue(new Error('offline'))
    loseConnection(DisconnectReason.STATE_MISMATCH)
    await jest.advanceTimersByTimeAsync(300)
    expect(refreshToken).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(999)
    expect(refreshToken).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(refreshToken).toHaveBeenCalledTimes(2)
    await client.disconnect()
    await jest.advanceTimersByTimeAsync(60000)
    expect(refreshToken).toHaveBeenCalledTimes(2)
    log.mockRestore()
  })
})
