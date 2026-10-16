
import { HulypulseClient } from './client'

class Socket {
  static OPEN = 1
  static CONNECTING = 0
  static instances: Socket[] = []
  readyState = Socket.OPEN
  onopen?: () => void
  onclose?: () => void
  onmessage?: (event: { data: string }) => void
  sent: any[] = []
  constructor () {
    Socket.instances.push(this)
    queueMicrotask(() => this.onopen?.())
  }
  close (): void { this.readyState = 3; this.onclose?.() }
  send (data: string): void {
    if (data === 'ping') return
    const msg = JSON.parse(data)
    this.sent.push(msg)
    queueMicrotask(() => this.onmessage?.({ data: JSON.stringify({
      command: msg.type, correlation: msg.correlation, result: msg.type === 'list' ? [] : true
    }) }))
  }
}

const originalWebSocket = globalThis.WebSocket
let client: HulypulseClient | undefined

afterEach(() => {
  client?.close()
  client = undefined
  globalThis.WebSocket = originalWebSocket
  Socket.instances = []
  jest.useRealTimers()
})

async function connect (): Promise<Socket> {
  globalThis.WebSocket = Socket as unknown as typeof WebSocket
  client = await HulypulseClient.connect('ws://localhost')
  return Socket.instances[0]
}

describe('Pulse delivery failures', () => {
  test('put rejects when transport is unavailable', async () => {
    const socket = await connect()
    socket.readyState = 3
    await expect(client!.put('knock', {}, 10)).rejects.toThrow('WebSocket is not open')
  })

  test('put rejects when acknowledgement never arrives', async () => {
    const socket = await connect()
    ;(client as any).SEND_TIMEOUT_MS = 5
    socket.send = () => {}
    await expect(client!.put('knock', {}, 10)).rejects.toThrow('Timeout waiting for response')
  })

  test('failed subscription can be retried with same callback', async () => {
    const socket = await connect()
    const callback = jest.fn()
    socket.readyState = 3
    await expect(client!.subscribe('knock', callback)).rejects.toThrow()
    socket.readyState = Socket.OPEN
    await client!.subscribe('knock', callback)
    expect(socket.sent.filter((msg) => msg.type === 'sub')).toHaveLength(1)
  })

  test('closing transport rejects outstanding deliveries immediately', async () => {
    const socket = await connect()
    socket.send = () => {}
    const delivery = client!.put('invite', {}, 10)
    client!.close()
    await expect(delivery).rejects.toThrow('connection closed')
  })

  test('heartbeat reconnects open socket that never answers ping', async () => {
    const socket = await connect()
    jest.useFakeTimers()
    ;(client as any).PING_INTERVAL_MS = 2
    ;(client as any).PING_TIMEOUT_MS = 8
    ;(client as any).startPing()
    await jest.advanceTimersByTimeAsync(25)
    expect(socket.readyState).toBe(3)
  })
})

test('refresh recovers responses with only one second left', async () => {
  await connect()
  jest.spyOn(client as any, 'send').mockResolvedValue({ result: [
    { key: 'response/room', data: JSON.stringify({ accept: true }), ttl: 1 },
    { key: 'expired', data: '{}', ttl: 0 }
  ] })
  const notify = jest.fn()
  await client!.refresh('response/', notify)
  expect(notify).toHaveBeenCalledTimes(1)
  expect(notify).toHaveBeenCalledWith('response/room', { accept: true })
})
