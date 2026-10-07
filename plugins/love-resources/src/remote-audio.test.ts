import type { RemoteTrack } from 'livekit-client'
import { RemoteAudio } from './remote-audio'

function createTrack (): { track: RemoteTrack, element: HTMLMediaElement } {
  const element = { remove: jest.fn() } as unknown as HTMLMediaElement
  const track = { attach: jest.fn(() => element), detach: jest.fn() } as unknown as RemoteTrack
  return { track, element }
}

describe('remote audio attachments', () => {
  test('late unsubscribe cannot detach replacement audio after reconnect', () => {
    const parent = { appendChild: jest.fn() } as unknown as HTMLElement
    const audio = new RemoteAudio(parent)
    const previous = createTrack()
    const replacement = createTrack()
    audio.attach(previous.track)
    audio.reconcile([replacement.track])
    audio.detach(previous.track)
    expect(previous.track.detach).toHaveBeenCalledWith(previous.element)
    expect(previous.element.remove).toHaveBeenCalledTimes(1)
    expect(replacement.track.detach).not.toHaveBeenCalled()
    expect(replacement.element.remove).not.toHaveBeenCalled()
    expect(parent.appendChild).toHaveBeenLastCalledWith(replacement.element)
  })

  test('reconciliation recovers existing tracks without duplicate audio', () => {
    const parent = { appendChild: jest.fn() } as unknown as HTMLElement
    const audio = new RemoteAudio(parent)
    const { track, element } = createTrack()
    audio.reconcile([track])
    audio.attach(track)
    audio.reconcile([track])
    expect(track.attach).toHaveBeenCalledTimes(1)
    expect(parent.appendChild).toHaveBeenCalledTimes(1)
    audio.clear()
    expect(track.detach).toHaveBeenCalledWith(element)
    expect(element.remove).toHaveBeenCalledTimes(1)
  })
})
