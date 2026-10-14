import { logConnectionDiagnostic } from './connection-diagnostics'

describe('exportable meeting connection diagnostics', () => {
  let warn: jest.SpyInstance
  beforeEach(() => { warn = jest.spyOn(console, 'warn').mockImplementation(() => {}) })
  afterEach(() => { warn.mockRestore() })

  test('keeps close code and transport state in one timestamped text record', () => {
    logConnectionDiagnostic(3, 'websocket closed', {
      code: 1006, wasClean: false, state: 'connected', roomID: 'room', pID: 'participant',
      engine: { closed: true, transportsConnected: false }
    })
    const line = warn.mock.calls[0][0] as string
    const record = JSON.parse(line.slice('[meeting-connection] '.length))
    expect(record).toMatchObject({
      event: 'websocket closed', code: 1006, wasClean: false, state: 'connected',
      roomID: 'room', participantID: 'participant', engineClosed: true, transportsConnected: false
    })
    expect(Number.isNaN(Date.parse(record.timestamp))).toBe(false)
  })

  test('exports reconciliation failures without copying credentials or SDK objects', () => {
    const context: any = {
      numFailures: 3, engine: { closed: false, transportsConnected: false },
      access_token: 'secret-token', url: 'wss://server?token=secret-token', reason: 'secret-token'
    }
    context.circular = context
    logConnectionDiagnostic(3, 'detected connection state mismatch', context)
    const line = warn.mock.calls[0][0] as string
    expect(line).toContain('"numFailures":3')
    expect(line).toContain('"transportsConnected":false')
    expect(line).not.toContain('secret-token')
    expect(line).not.toContain('circular')
  })

  test('ignores unrelated SDK messages and handles missing connection context', () => {
    logConnectionDiagnostic(3, 'publishing track', {})
    expect(warn).not.toHaveBeenCalled()
    logConnectionDiagnostic(3, 'websocket closed')
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
