import { HocuspocusCollabProvider } from './hocuspocus'

jest.mock('@hocuspocus/provider', () => ({
  HocuspocusProvider: class {
    configuration: any

    constructor (configuration: any) {
      this.configuration = {
        ...configuration,
        websocketProvider: configuration.websocketProvider ?? {
          destroy: jest.fn(),
          disconnect: jest.fn()
        }
      }
    }

    on (): void {}
    destroy (): void {}
  }
}))

describe('collaboration provider teardown', () => {
  it('destroys its own socket provider to stop connection timers and retries', () => {
    const provider = new HocuspocusCollabProvider({
      url: 'ws://localhost', name: 'doc', token: 'token', parameters: { content: null }
    })
    const socket = provider.configuration.websocketProvider

    provider.destroy()

    expect(socket.destroy).toHaveBeenCalledTimes(1)
    expect(socket.disconnect).not.toHaveBeenCalled()
  })

  it('leaves a supplied shared socket provider available to other documents', () => {
    const socket = { destroy: jest.fn(), disconnect: jest.fn() }
    const provider = new HocuspocusCollabProvider({
      url: 'ws://localhost',
      name: 'doc',
      token: 'token',
      parameters: { content: null },
      websocketProvider: socket as any
    })

    provider.destroy()

    expect(socket.destroy).not.toHaveBeenCalled()
    expect(socket.disconnect).not.toHaveBeenCalled()
  })
})
