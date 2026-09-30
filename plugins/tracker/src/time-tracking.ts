import type { Ref, Status } from '@hcengineering/core'
import tracker from './index'

export interface IssueTimeState {
  trackedTimeMs: number
  trackingStartedOn: number | null
}

export function isTimedIssueStatus (status: Ref<Status>): boolean {
  return status === tracker.status.Backlog ||
    status === tracker.status.Todo ||
    status === tracker.status.InProgress ||
    status === tracker.status.UnderReview
}

export function transitionIssueTime (
  state: IssueTimeState,
  previousStatus: Ref<Status>,
  nextStatus: Ref<Status>,
  at: number
): IssueTimeState {
  if (previousStatus === nextStatus) return state

  const trackedTimeMs =
    state.trackedTimeMs +
    (isTimedIssueStatus(previousStatus) && state.trackingStartedOn !== null
      ? Math.max(0, at - state.trackingStartedOn)
      : 0)

  return {
    trackedTimeMs,
    trackingStartedOn: isTimedIssueStatus(nextStatus) ? at : null
  }
}

export function issueTimeHours (state: IssueTimeState, at: number): number {
  return (state.trackedTimeMs + (state.trackingStartedOn !== null ? Math.max(0, at - state.trackingStartedOn) : 0)) / 3600000
}

export function currentReportedTime (
  issue: { reportedTime: number, trackedTimeMs?: number, trackingStartedOn?: number | null },
  at: number
): number {
  if (issue.trackedTimeMs === undefined) return issue.reportedTime
  return issueTimeHours({ trackedTimeMs: issue.trackedTimeMs, trackingStartedOn: issue.trackingStartedOn ?? null }, at)
}
