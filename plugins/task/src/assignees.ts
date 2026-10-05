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

/** Canonical draft/template writes keep nested assignment lists and no scalar fields. */
export function withTaskAssignees<T extends TaskAssignees> (value: T): T & { assignees: Ref<Person>[] } {
  const result = { ...value, assignees: getTaskAssignees(value) }
  delete result.assignee
  for (const key of ['children', 'subIssues']) {
    const items = (value as any)[key]
    if (Array.isArray(items)) (result as any)[key] = items.map(withTaskAssignees)
  }
  return result
}
