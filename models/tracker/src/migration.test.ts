import type { MigrationClient } from '@hcengineering/model'
import type { Issue } from '@hcengineering/tracker'
import { syncChildTimeSnapshots } from './migration'

describe('syncChildTimeSnapshots', () => {
  it('updates only matching child snapshots and stays stable on repetition', async () => {
    const parent = {
      _id: 'parent',
      childInfo: [
        { childId: 'child', estimation: 4, reportedTime: 1 },
        { childId: 'missing', estimation: 2, reportedTime: 2 }
      ]
    } as unknown as Issue
    const child = {
      _id: 'child',
      reportedTime: 3,
      trackedTimeMs: 10800000,
      trackingStartedOn: 5000
    } as unknown as Issue
    const update = jest.fn(async (_domain, _query, operations) => {
      parent.childInfo = operations.childInfo
    })
    const client = {
      traverse: jest.fn(async () => {
        let read = false
        return {
          next: async () => {
            if (read) return null
            read = true
            return [parent]
          },
          close: async () => {}
        }
      }),
      find: jest.fn(async () => [child]),
      update
    } as unknown as MigrationClient

    await syncChildTimeSnapshots(client)
    await syncChildTimeSnapshots(client)

    expect(update).toHaveBeenCalledTimes(1)
    expect(parent.childInfo).toEqual([
      {
        childId: 'child',
        estimation: 4,
        reportedTime: 3,
        trackedTimeMs: 10800000,
        trackingStartedOn: 5000
      },
      { childId: 'missing', estimation: 2, reportedTime: 2 }
    ])
  })
})
