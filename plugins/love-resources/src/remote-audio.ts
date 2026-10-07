import type { RemoteTrack } from 'livekit-client'

/** Own each element by track instance: a late unsubscribe must not remove its replacement. */
export class RemoteAudio {
  private readonly elements = new Map<RemoteTrack, HTMLMediaElement>()

  constructor (private readonly parent: HTMLElement) {}

  attach (track: RemoteTrack): void {
    if (this.elements.has(track)) return
    const element = track.attach()
    this.elements.set(track, element)
    this.parent.appendChild(element)
  }

  detach (track: RemoteTrack): void {
    const element = this.elements.get(track)
    if (element === undefined) return
    track.detach(element)
    element.remove()
    this.elements.delete(track)
  }

  reconcile (tracks: RemoteTrack[]): void {
    const current = new Set(tracks)
    for (const track of this.elements.keys()) {
      if (!current.has(track)) this.detach(track)
    }
    for (const track of tracks) this.attach(track)
  }

  clear (): void {
    for (const track of this.elements.keys()) this.detach(track)
  }
}
