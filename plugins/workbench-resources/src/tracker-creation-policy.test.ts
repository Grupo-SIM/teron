import { describe, expect, test } from 'bun:test'
import { isUnrestrictedTrackerCreation } from './tracker-creation-policy'

describe('tracker creation controls', () => {
  test('allows project and task controls without a workspace manager role', () => {
    for (const identifier of [
      'tracker:class:Milestone',
      'tracker:class:Issue',
      'tracker:component:NewMilestone',
      'tracker:component:CreateIssue',
      'tracker:component:CreateIssueTemplate'
    ]) {
      expect(isUnrestrictedTrackerCreation(identifier)).toBe(true)
    }
  })

  test('preserves sector creation and other applications role restrictions', () => {
    for (const identifier of [
      'tracker:class:Project',
      'tracker:component:CreateProject',
      'document:component:CreateDocument',
      undefined
    ]) {
      expect(isUnrestrictedTrackerCreation(identifier)).toBe(false)
    }
  })
})
