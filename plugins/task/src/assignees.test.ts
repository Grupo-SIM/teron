import { getTaskAssignees } from './assignees'
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
