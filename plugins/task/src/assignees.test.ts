import { getTaskAssignees, withTaskAssignees } from './assignees'
import type { Person } from '@hcengineering/contact'
import type { Ref } from '@hcengineering/core'
const first = 'first' as Ref<Person>
const second = 'second' as Ref<Person>
describe('task assignees', () => {
  it('reads zero, one and several people, deduplicating recipients', () => {
    expect(getTaskAssignees({})).toEqual([])
    expect(getTaskAssignees({ assignee: first })).toEqual([first])
    expect(getTaskAssignees({ assignees: [first, second, first] })).toEqual([first, second])
  })
  it('gives the new list precedence and remains idempotent', () => {
    expect(getTaskAssignees({ assignee: first, assignees: [] })).toEqual([])
    const assignees = getTaskAssignees({ assignee: first })
    expect(getTaskAssignees({ assignees })).toEqual(assignees)
  })
})

it('canonicalizes nested drafts without mutating legacy source or retaining scalar fields', () => {
  const legacy: any = { assignee: 'one', subIssues: [{ assignee: 'two' }, { assignee: 'one', assignees: [] }], children: [{ assignees: ['one', 'one', 'two'] }] }
  expect(withTaskAssignees(legacy)).toEqual({ assignees: ['one'], subIssues: [{ assignees: ['two'] }, { assignees: [] }], children: [{ assignees: ['one', 'two'] }] })
  expect(legacy.assignee).toBe('one')
  expect(legacy.subIssues[0].assignee).toBe('two')
})
