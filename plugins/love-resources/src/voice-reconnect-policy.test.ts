import { voiceReconnectPolicy } from './voice-reconnect-policy'

describe('voice reconnect policy', () => {
  test('keeps retrying after the default SDK retry window and extended outages', () => {
    for (const retryCount of [0, 1, 9, 10, 100, 10000]) {
      const delay = voiceReconnectPolicy.nextRetryDelayInMs({ retryCount, elapsedMs: retryCount * 30000 })
      expect(delay).not.toBeNull()
      expect(delay).toBeGreaterThan(0)
      expect(delay).toBeLessThanOrEqual(30000)
    }
  })

  test('backs off to avoid hammering the server while the network is unavailable', () => {
    expect(voiceReconnectPolicy.nextRetryDelayInMs({ retryCount: 0, elapsedMs: 0 })).toBe(300)
    expect(voiceReconnectPolicy.nextRetryDelayInMs({ retryCount: 1, elapsedMs: 300 })).toBe(600)
    expect(voiceReconnectPolicy.nextRetryDelayInMs({ retryCount: 7, elapsedMs: 60000 })).toBe(30000)
  })
})
