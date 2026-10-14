import type { RemoteTrack } from 'livekit-client'
import { RemoteAudio } from './remote-audio'

function createTrack (): { track: RemoteTrack, element: HTMLMediaElement } {
  const mediaStreamTrack = {} as MediaStreamTrack
  const element = {
    remove: jest.fn(),
    paused: false,
    ended: false,
    srcObject: { getAudioTracks: () => [mediaStreamTrack] }
  } as unknown as HTMLMediaElement
  const track = { mediaStreamTrack, attach: jest.fn(() => element), detach: jest.fn() } as unknown as RemoteTrack
  return { track, element }
}

function createParent (): HTMLElement {
  const parent = {
    appendChild: jest.fn((element: HTMLMediaElement) => {
      Object.defineProperty(element, 'parentElement', { configurable: true, value: parent })
    })
  } as unknown as HTMLElement
  return parent
}

describe('remote audio attachments', () => {
  test('late unsubscribe cannot detach replacement audio after reconnect', () => {
    const parent = createParent()
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

  test.each(['paused', 'ended', 'missing stream', 'replaced stream', 'removed element'])(
    'repairs %s on the existing audio element', (failure) => {
      const parent = createParent()
      const audio = new RemoteAudio(parent)
      const { track, element } = createTrack()
      const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        audio.attach(track)
        if (failure === 'paused') Object.defineProperty(element, 'paused', { value: true })
        if (failure === 'ended') Object.defineProperty(element, 'ended', { value: true })
        if (failure === 'missing stream') element.srcObject = null
        if (failure === 'replaced stream') {
          element.srcObject = { getAudioTracks: () => [] } as unknown as MediaStream
        }
        if (failure === 'removed element') Object.defineProperty(element, 'parentElement', { value: null })
        audio.reconcile([track])
        expect(track.attach).toHaveBeenLastCalledWith(element)
        expect(track.attach).toHaveBeenCalledTimes(2)
        expect(track.detach).not.toHaveBeenCalled()
        expect(parent.appendChild).toHaveBeenCalledTimes(failure === 'removed element' ? 2 : 1)
        expect(warning).toHaveBeenCalledTimes(1)
      } finally {
        warning.mockRestore()
      }
    }
  )

  test('reconciliation recovers existing tracks without duplicate audio', () => {
    const parent = createParent()
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
