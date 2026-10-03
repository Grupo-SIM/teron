import type { Ref } from '@hcengineering/core'
import type { Person } from '@hcengineering/contact'
import { getTaskAssignees, type Task } from '@hcengineering/task'
import type { ToDo } from '@hcengineering/time'

export function assigneeTodoChanges (issue: Pick<Task, 'assignee' | 'assignees'>, todos: ToDo[]): { create: Ref<Person>[], complete: ToDo[] } {
  const assignees = getTaskAssignees(issue)
  const active = todos.filter((todo) => todo.doneOn == null)
  return {
    create: assignees.filter((person) => !active.some((todo) => todo.user === person)),
    complete: active.filter((todo) => !assignees.includes(todo.user))
  }
}
