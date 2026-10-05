import { AccountRole, type Account } from '@hcengineering/core'
import { canMutateWorkspaceClass } from './workspace-role-policy'
import { canDeleteWorkspaceFolder } from './folder-role-policy'

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
