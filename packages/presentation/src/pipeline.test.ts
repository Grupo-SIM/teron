import { type Client, type Tx } from '@hcengineering/core'
import platform, { PlatformError, Severity, Status, setPlatformStatus } from '@hcengineering/platform'
import { PresentationPipelineImpl, type PresentationMiddleware } from './pipeline'

jest.mock('@hcengineering/platform', () => {
  const actual = jest.requireActual('@hcengineering/platform')
  return { ...actual, __esModule: true, setPlatformStatus: jest.fn() }
})

describe('presentation transaction failures', () => {
  const tx = {} as Tx
  const errors = [
    new Error('Cannot attach content across spaces.'),
    new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})),
    new PlatformError(new Status(Severity.ERROR, platform.status.ConnectionClosed, {}))
  ]

  beforeEach(() => jest.clearAllMocks())

  test.each(errors)('rejects direct writes instead of reporting success: %s', async (error) => {
    const client = { tx: jest.fn().mockRejectedValue(error) } as unknown as Client
    const pipeline = PresentationPipelineImpl.create(client, [])
    await expect(pipeline.tx(tx)).rejects.toBe(error)
    expect(client.tx).toHaveBeenCalledWith(tx)
    if (!(error instanceof PlatformError) || error.status.code !== platform.status.ConnectionClosed) {
      expect(setPlatformStatus).toHaveBeenCalledTimes(1)
    }
  })

  test.each(errors)('propagates middleware write failures: %s', async (error) => {
    const client = { tx: jest.fn() } as unknown as Client
    const middleware = { tx: jest.fn().mockRejectedValue(error) } as unknown as PresentationMiddleware
    const pipeline = PresentationPipelineImpl.create(client, [() => middleware])
    await expect(pipeline.tx(tx)).rejects.toBe(error)
    expect(client.tx).not.toHaveBeenCalled()
  })

  test('preserves successful batch acknowledgement', async () => {
    const result = { success: true, serverTime: 10 }
    const client = { tx: jest.fn().mockResolvedValue(result) } as unknown as Client
    await expect(PresentationPipelineImpl.create(client, []).tx(tx)).resolves.toBe(result)
    expect(setPlatformStatus).not.toHaveBeenCalled()
  })
})
