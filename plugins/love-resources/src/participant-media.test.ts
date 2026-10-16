import { type Participant, Track, type TrackPublication } from 'livekit-client'
import { getParticipantMedia } from './participant-media'

function participant (...publications: Array<Partial<TrackPublication>>): Pick<Participant, 'trackPublications'> {
  return { trackPublications: new Map(publications.map((publication, index) => [String(index), publication as TrackPublication])) }
}

describe('participant media state', () => {
  test('screen audio never changes microphone mute state', () => {
    expect(getParticipantMedia(participant(
      { source: Track.Source.Microphone, isMuted: true },
      { source: Track.Source.ScreenShareAudio, isMuted: false }
    )).microphoneMuted).toBe(true)
    expect(getParticipantMedia(participant(
      { source: Track.Source.Microphone, isMuted: false },
      { source: Track.Source.ScreenShareAudio, isMuted: true }
    )).microphoneMuted).toBe(false)
  })

  test('publication state takes precedence over missing or stale subscribed track state', () => {
    expect(getParticipantMedia(participant({ source: Track.Source.Microphone, isMuted: false })).microphoneMuted).toBe(false)
    expect(getParticipantMedia(participant({
      source: Track.Source.Microphone,
      isMuted: true,
      track: { isMuted: false } as Track
    })).microphoneMuted).toBe(true)
  })

  test('unpublishing microphone resets mute state even while screen audio remains', () => {
    expect(getParticipantMedia(participant({ source: Track.Source.ScreenShareAudio, isMuted: false })).microphoneMuted).toBe(true)
    expect(getParticipantMedia(undefined).microphoneMuted).toBe(true)
  })

  test('unsubscribe clears current track before LiveKit updates its publication without clearing replacement', () => {
    const previous = {} as Track
    const replacement = {} as Track
    const current = participant({ source: Track.Source.Camera, isMuted: false, track: previous })
    expect(getParticipantMedia(current, previous).cameraTrack).toBeUndefined()
    expect(getParticipantMedia(current, previous).cameraMuted).toBe(true)
    const updated = participant({ source: Track.Source.Camera, isMuted: false, track: replacement })
    expect(getParticipantMedia(updated, previous).cameraTrack).toBe(replacement)
  })

  test('camera state ignores screen sharing and follows current publication after replacement', () => {
    const camera = {} as Track
    const screen = {} as Track
    const state = getParticipantMedia(participant(
      { source: Track.Source.ScreenShare, isMuted: false, track: screen },
      { source: Track.Source.Camera, isMuted: true, track: camera }
    ))
    expect(state.cameraTrack).toBe(camera)
    expect(state.cameraMuted).toBe(true)
    expect(getParticipantMedia(participant()).cameraTrack).toBeUndefined()
    expect(getParticipantMedia(participant({ source: Track.Source.Camera, isMuted: false })).cameraMuted).toBe(true)
  })
})
