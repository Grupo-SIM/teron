import { EventEmitter } from 'events'
import { ConnectionState, RoomEvent, Track, type Room } from 'livekit-client'
import { bindScreenShareView } from './screen-share-view'

function createTrack (): any {
  const mediaStreamTrack = new EventTarget() as EventTarget & { readyState: string }
  mediaStreamTrack.readyState = 'live'
  return Object.assign(new EventEmitter(), {
    kind: Track.Kind.Video,
    source: Track.Source.ScreenShare,
    isMuted: false,
    mediaStreamTrack,
    attach: jest.fn(),
    detach: jest.fn()
  })
}

function createRoom (track = createTrack()): any {
  const publication = { source: Track.Source.ScreenShare, isMuted: false, track }
  return Object.assign(new EventEmitter(), {
    state: ConnectionState.Connected,
    remoteParticipants: new Map([['remote', { trackPublications: new Map([['screen', publication]]) }]]),
    localParticipant: { trackPublications: new Map() },
    publication
  })
}

const flush = async (): Promise<void> => { await Promise.resolve() }

describe('screen share views', () => {
  test('one view detaching cannot clear another view; unsubscribe reads settled publication', async () => {
    const room = createRoom()
    const track = room.publication.track
    const first = {} as HTMLVideoElement
    const second = {} as HTMLVideoElement
    const firstActive = jest.fn()
    const secondActive = jest.fn()
    const view1 = bindScreenShareView(room as Room, first, () => true, firstActive)
    const view2 = bindScreenShareView(room as Room, second, () => true, secondActive)
    view1.destroy()
    expect(track.detach.mock.calls).toEqual([[first]])
    expect(secondActive).toHaveBeenLastCalledWith(true)
    room.emit(RoomEvent.TrackUnsubscribed, track, room.publication)
    room.publication.track = undefined
    await flush()
    expect(secondActive).toHaveBeenLastCalledWith(false)
    expect(track.detach.mock.calls).toEqual([[first], [second]])
    view2.destroy()
  })

  test('mute, ended capture, disconnect and reconnect reconcile both views', async () => {
    const room = createRoom()
    const track = room.publication.track
    const callbacks = [jest.fn(), jest.fn()]
    const views = callbacks.map((callback) => bindScreenShareView(room as Room, {} as HTMLVideoElement, () => true, callback))
    const expectActive = (value: boolean): void => {
      for (const callback of callbacks) expect(callback).toHaveBeenLastCalledWith(value)
    }
    room.publication.isMuted = true
    room.emit(RoomEvent.TrackMuted, room.publication)
    await flush()
    expectActive(false)
    room.publication.isMuted = false
    room.emit(RoomEvent.TrackUnmuted, room.publication)
    await flush()
    expectActive(true)
    room.state = ConnectionState.Reconnecting
    room.emit(RoomEvent.ConnectionStateChanged, room.state)
    await flush()
    expectActive(false)
    room.state = ConnectionState.Connected
    room.emit(RoomEvent.Reconnected)
    await flush()
    expectActive(true)
    track.mediaStreamTrack.readyState = 'ended'
    track.mediaStreamTrack.dispatchEvent(new Event('ended'))
    expectActive(false)
    for (const view of views) view.destroy()
    expect(room.eventNames()).toEqual([])
    expect(track.eventNames()).toEqual([])
  })

  test('late unsubscribe of old track preserves replacement; local exclusion and queued cleanup hold', async () => {
    const room = createRoom()
    const old = room.publication.track
    const callback = jest.fn()
    const view = bindScreenShareView(room as Room, {} as HTMLVideoElement, () => false, callback)
    room.publication.track = createTrack()
    room.emit(RoomEvent.TrackSubscribed, room.publication.track, room.publication)
    await flush()
    room.emit(RoomEvent.TrackUnsubscribed, old, room.publication)
    await flush()
    expect(callback).toHaveBeenLastCalledWith(true)
    room.remoteParticipants.clear()
    room.localParticipant.trackPublications.set('local', room.publication)
    room.emit(RoomEvent.LocalTrackPublished, room.publication)
    await flush()
    expect(callback).toHaveBeenLastCalledWith(false)
    room.emit(RoomEvent.TrackUnsubscribed, old, room.publication)
    view.destroy()
    const calls = callback.mock.calls.length
    await flush()
    expect(callback).toHaveBeenCalledTimes(calls)
  })
})
