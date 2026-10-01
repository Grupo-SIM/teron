import core, { TxFactory, type Ref } from '@hcengineering/core'
import type { TriggerControl } from '@hcengineering/server-core'
import tracker, { type Issue } from '@hcengineering/tracker'
import { OnIssueUpdate } from './index'

describe('OnIssueUpdate', () => {
  it('updates time and only the selected child snapshot when status changes', async () => {
    const factory = new TxFactory(core.account.System, true)
    const issue = {
      _id: 'selected' as Ref<Issue>,
      _class: tracker.class.Issue,
      space: core.space.Model,
      // Synchronous triggers run after the incoming transaction is persisted.
      status: tracker.status.Done,
      createdOn: 1000,
      modifiedOn: 1000,
      trackedTimeMs: 0,
      trackingStartedOn: 1000,
      reportedTime: 0,
      estimation: 3,
      parents: [{ parentId: 'parent' as Ref<Issue>, space: core.space.Model }]
    } as Issue
    const update = factory.createTxUpdateDoc(
      tracker.class.Issue,
      issue.space,
      issue._id,
      { status: tracker.status.Done },
      false,
      3601000
    )
    const control = {
      hierarchy: { isDerived: () => true },
      findAll: jest.fn(async () => [issue]),
      txFactory: factory
    } as unknown as TriggerControl

    const result = await OnIssueUpdate([update], control)
    const operations = result.map((tx) => (tx as typeof update).operations)

    expect(operations).toContainEqual({ trackedTimeMs: 3600000, trackingStartedOn: null, reportedTime: 1 })
    expect(operations).toContainEqual({ $pull: { childInfo: { childId: issue._id } } })
    expect(operations).toContainEqual({
      $push: {
        childInfo: {
          childId: issue._id,
          estimation: 3,
          reportedTime: 1,
          trackedTimeMs: 3600000,
          trackingStartedOn: null
        }
      }
    })
  })
})
