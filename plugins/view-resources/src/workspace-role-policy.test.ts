import { AccountRole, type Account } from '@hcengineering/core'
import { canMutateWorkspaceClass } from './workspace-role-policy'

const account = (role: AccountRole): Account => ({ role } as Account)

describe('workspace role ceiling', () => {
  test.each([AccountRole.ReadOnlyGuest, AccountRole.DocGuest])('guests cannot mutate (%s)', (role) => {
    for (const operation of ['create', 'update', 'remove'] as const) {
      expect(canMutateWorkspaceClass(account(role), ['document:class:Document'], operation)).toBe(false)
    }
  })
  test.each(['document:class:Teamspace', 'tracker:class:Project', 'drive:class:File', 'contact:class:Person'])('members cannot manage structural records (%s)', (id) => {
    for (const operation of ['create', 'update', 'remove'] as const) {
      expect(canMutateWorkspaceClass(account(AccountRole.User), [id], operation)).toBe(false)
    }
  })
  test('members retain guideline content edits but cannot delete or move', () => {
    const member = account(AccountRole.User)
    const classes = ['document:class:Document']
    expect(canMutateWorkspaceClass(member, classes, 'create')).toBe(true)
    expect(canMutateWorkspaceClass(member, classes, 'update', 'title')).toBe(true)
    expect(canMutateWorkspaceClass(member, classes, 'update', 'parent')).toBe(false)
    expect(canMutateWorkspaceClass(member, classes, 'remove')).toBe(false)
  })
  test.each(Object.values(AccountRole))('all roles can manage derived tasks (%s)', (role) => {
    const classes = ['tracker:class:Issue', 'task:class:Task']
    for (const operation of ['create', 'update', 'remove'] as const) {
      expect(canMutateWorkspaceClass(account(role), classes, operation)).toBe(true)
    }
    for (const field of ['description', 'status', 'estimation', 'assignees', 'dueDate', 'title', 'priority']) {
      expect(canMutateWorkspaceClass(account(role), classes, 'update', field)).toBe(true)
    }
  })
  test('members retain folder creation/deletion, but cannot rename', () => {
    const member = account(AccountRole.User)
    expect(canMutateWorkspaceClass(member, ['drive:class:Folder'], 'create')).toBe(true)
    expect(canMutateWorkspaceClass(member, ['drive:class:Folder'], 'remove')).toBe(true)
    expect(canMutateWorkspaceClass(member, ['drive:class:Folder'], 'update', 'title')).toBe(false)
  })
  test('members retain personal agenda and todo actions', () => {
    for (const id of ['calendar:class:Event', 'calendar:class:Schedule', 'time:class:ToDo']) {
      for (const operation of ['create', 'update', 'remove'] as const) {
        expect(canMutateWorkspaceClass(account(AccountRole.User), [id], operation)).toBe(true)
      }
    }
  })
  test.each([AccountRole.Maintainer, AccountRole.Owner])('administrators pass role ceiling (%s)', (role) => {
    for (const operation of ['create', 'update', 'remove'] as const) {
      expect(canMutateWorkspaceClass(account(role), ['document:class:Teamspace'], operation)).toBe(true)
    }
  })
})
