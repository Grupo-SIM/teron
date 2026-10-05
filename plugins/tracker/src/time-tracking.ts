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

  return settleIssueTime(state, nextStatus, at)
}

/** Settle an interval after persistence has already replaced the status. */
export function settleIssueTime (
  state: IssueTimeState,
  nextStatus: Ref<Status>,
  at: number
): IssueTimeState {

  const trackedTimeMs =
    state.trackedTimeMs +
    (state.trackingStartedOn !== null
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

export function currentChildReportedTime (
  children: Array<{ reportedTime: number, trackedTimeMs?: number, trackingStartedOn?: number | null }> | undefined,
  at: number
): number {
  return (children ?? []).reduce((total, child) => total + currentReportedTime(child, at), 0)
}
