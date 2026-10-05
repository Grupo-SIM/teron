import type { ReconnectPolicy } from 'livekit-client'

// Keep the SDK session alive during extended outages. Explicit disconnects and
// unrecoverable server responses still stop recovery inside LiveKit.
export const voiceReconnectPolicy: ReconnectPolicy = {
  nextRetryDelayInMs: ({ retryCount }) => Math.min(300 * 2 ** Math.min(retryCount, 7), 30000)
}
