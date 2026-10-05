import { AccountRole, type Account } from '@hcengineering/core'
import { canMutateWorkspaceClass } from './workspace-role-policy'
import { canDeleteWorkspaceFolder, canDeleteWorkspaceDocument } from './folder-role-policy'

describe('folder role permissions', () => {
  it('allows User folders regardless of creator without allowing other entities', () => {
    const account = { role: AccountRole.User } as Account
    expect(canDeleteWorkspaceFolder(account, ['drive:class:Folder', 'drive:class:Resource'])).toBe(true)
    expect(canMutateWorkspaceClass(account, ['drive:class:Folder'], 'create')).toBe(true)
    expect(canMutateWorkspaceClass(account, ['drive:class:Folder'], 'remove')).toBe(true)
    expect(canMutateWorkspaceClass(account, ['drive:class:Folder'], 'update')).toBe(false)
    expect(canDeleteWorkspaceFolder(account, ['drive:class:File', 'drive:class:Resource'])).toBe(false)
    expect(canDeleteWorkspaceFolder(account, ['drive:class:Drive'])).toBe(false)
  })

  it('keeps read-only accounts from deleting folders', () => {
    expect(canDeleteWorkspaceFolder({ role: AccountRole.ReadOnlyGuest } as Account, ['drive:class:Folder'])).toBe(false)
  })
})

describe('document deletion role ceiling', () => {
  test.each([AccountRole.User, AccountRole.Maintainer, AccountRole.Owner])('members may delete derived documents (%s)', (role) => {
    expect(canDeleteWorkspaceDocument({ role } as Account, ['custom:class:Document', 'document:class:Document'])).toBe(true)
    expect(canDeleteWorkspaceDocument({ role } as Account, ['document:class:Teamspace'])).toBe(false)
  })
  test.each([AccountRole.ReadOnlyGuest, AccountRole.DocGuest])('guests cannot delete documents (%s)', (role) => {
    expect(canDeleteWorkspaceDocument({ role } as Account, ['document:class:Document'])).toBe(false)
  })
})
