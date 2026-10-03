import type { Person } from '@hcengineering/contact'
import type { Ref } from '@hcengineering/core'

export interface TaskAssignees {
  assignees?: Ref<Person>[]
  assignee?: Ref<Person> | null
}

/** An explicitly empty list overrides a legacy single assignee. */
export function getTaskAssignees (value: TaskAssignees): Ref<Person>[] {
  return [...new Set(value.assignees ?? (value.assignee == null ? [] : [value.assignee]))]
}
