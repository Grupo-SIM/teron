import type { Ref } from '@hcengineering/core'
import type { Person } from '@hcengineering/contact'
import type { ToDo } from '@hcengineering/time'
import { assigneeTodoChanges } from './assignee-todos'
const first = 'first' as Ref<Person>
const second = 'second' as Ref<Person>
const todo = (user: Ref<Person>, doneOn: number | null = null): ToDo => ({ user, doneOn }) as ToDo
describe('multiple assignees personal agenda integration', () => {
  it('retains active work for unchanged people and creates once for new people', () => {
    const kept = todo(first)
    expect(assigneeTodoChanges({ assignee: null, assignees: [first, second, second] }, [kept])).toEqual({ create: [second], complete: [] })
  })
  it('completes removed assignees only, including explicit empty lists', () => {
    const removed = todo(second)
    expect(assigneeTodoChanges({ assignee: null, assignees: [first] }, [todo(first), removed])).toEqual({ create: [], complete: [removed] })
    expect(assigneeTodoChanges({ assignee: first, assignees: [] }, [removed])).toEqual({ create: [], complete: [removed] })
  })
  it('creates new active work after reopening, preserving completed history and legacy reads', () => {
    expect(assigneeTodoChanges({ assignee: first }, [todo(first, 123)])).toEqual({ create: [first], complete: [] })
  })
})
