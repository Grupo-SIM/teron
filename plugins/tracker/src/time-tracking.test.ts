import tracker, { issueTimeHours, transitionIssueTime } from './index'

describe('automatic issue time', () => {
  it('counts pending, active and review intervals, including reopened work', () => {
    let state = { trackedTimeMs: 0, trackingStartedOn: 0 as number | null }
    state = transitionIssueTime(state, tracker.status.Backlog, tracker.status.InProgress, 3600000)
    state = transitionIssueTime(state, tracker.status.InProgress, tracker.status.UnderReview, 7200000)
    state = transitionIssueTime(state, tracker.status.UnderReview, tracker.status.Done, 10800000)
    expect(issueTimeHours(state, 14400000)).toBe(3)
    state = transitionIssueTime(state, tracker.status.Done, tracker.status.Backlog, 18000000)
    state = transitionIssueTime(state, tracker.status.Backlog, tracker.status.Canceled, 21600000)
    expect(issueTimeHours(state, 25200000)).toBe(4)
  })

  it('does not count finished or adjustment time', () => {
    const state = { trackedTimeMs: 3600000, trackingStartedOn: null }
    expect(issueTimeHours(transitionIssueTime(state, tracker.status.Done, tracker.status.Canceled, 7200000), 10800000)).toBe(1)
  })

  it('ignores repeated status updates and negative clock intervals', () => {
    const state = { trackedTimeMs: 3600000, trackingStartedOn: 5000 }
    expect(transitionIssueTime(state, tracker.status.InProgress, tracker.status.InProgress, 8000)).toEqual(state)
    expect(transitionIssueTime(state, tracker.status.InProgress, tracker.status.Done, 4000)).toEqual({
      trackedTimeMs: 3600000,
      trackingStartedOn: null
    })
  })
})
