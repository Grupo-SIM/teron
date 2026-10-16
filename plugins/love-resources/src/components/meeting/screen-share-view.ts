import { ConnectionState, RoomEvent, Track, TrackEvent, type Room, type TrackPublication } from 'livekit-client'

export function bindScreenShareView (
  room: Room,
  screen: HTMLVideoElement,
  showLocalTrack: () => boolean,
  onActive: (active: boolean) => void
): { reconcile: () => void, destroy: () => void } {
  let activeTrack: Track | null = null
  let destroyed = false

  function setActiveTrack (track: Track | null): void {
    onActive(track !== null)
    if (track === activeTrack) return
    activeTrack?.off(TrackEvent.Ended, reconcile)
    activeTrack?.mediaStreamTrack.removeEventListener('ended', reconcile)
    activeTrack?.detach(screen)
    activeTrack = track
    activeTrack?.on(TrackEvent.Ended, reconcile)
    activeTrack?.mediaStreamTrack.addEventListener('ended', reconcile)
    activeTrack?.attach(screen)
  }

  function availableTrack (publication: TrackPublication): Track | null {
    const track = publication.track
    return publication.source === Track.Source.ScreenShare &&
      !publication.isMuted && track?.kind === Track.Kind.Video &&
      !track.isMuted && track.mediaStreamTrack.readyState !== 'ended'
      ? track
      : null
  }

  function reconcile (): void {
    if (destroyed) return
    let track: Track | null = null
    if (room.state === ConnectionState.Connected) {
      for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
          track = availableTrack(publication)
          if (track !== null) break
        }
        if (track !== null) break
      }
      if (showLocalTrack()) {
        for (const publication of room.localParticipant.trackPublications.values()) {
          const localTrack = availableTrack(publication)
          if (localTrack !== null) {
            track = localTrack
            break
          }
        }
      }
    }
    setActiveTrack(track)
  }

  // LiveKit emits unsubscribe before clearing publication.track. Read the settled snapshot.
  function onRoomChange (): void {
    queueMicrotask(reconcile)
  }

  const events = [
    RoomEvent.TrackSubscribed,
    RoomEvent.TrackUnsubscribed,
    RoomEvent.TrackPublished,
    RoomEvent.TrackUnpublished,
    RoomEvent.TrackMuted,
    RoomEvent.TrackUnmuted,
    RoomEvent.LocalTrackPublished,
    RoomEvent.LocalTrackUnpublished,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ConnectionStateChanged,
    RoomEvent.Reconnected
  ]
  for (const event of events) room.on(event, onRoomChange)
  reconcile()
  return {
    reconcile,
    destroy: () => {
      destroyed = true
      setActiveTrack(null)
      for (const event of events) room.off(event, onRoomChange)
    }
  }
}
