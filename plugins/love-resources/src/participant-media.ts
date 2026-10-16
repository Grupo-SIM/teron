import { type Participant, Track } from 'livekit-client'

// Publications carry server mute state even before a remote track is subscribed.
export function getParticipantMedia (
  participant: Pick<Participant, 'trackPublications'> | undefined,
  unsubscribedTrack?: Track
): {
  microphoneMuted: boolean
  cameraMuted: boolean
  cameraTrack: Track | undefined
} {
  const publications = Array.from(participant?.trackPublications.values() ?? [])
  const microphone = publications.find((publication) => publication.source === Track.Source.Microphone)
  const camera = publications.find((publication) => publication.source === Track.Source.Camera)
  const cameraTrack = camera?.track === unsubscribedTrack ? undefined : camera?.track
  return {
    microphoneMuted: microphone?.isMuted ?? true,
    cameraMuted: cameraTrack === undefined || (camera?.isMuted ?? true),
    cameraTrack
  }
}
