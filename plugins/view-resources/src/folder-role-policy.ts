import { AccountRole, hasAccountRole, type Account } from '@hcengineering/core'

/** Folder deletion remains subject to access and per-space permissions. */
export function canDeleteWorkspaceFolder (account: Account, ancestors: readonly string[]): boolean {
  return hasAccountRole(account, AccountRole.User) && ancestors.includes('drive:class:Folder')
}

/** Document deletion remains subject to editor grants and per-space permissions. */
export function canDeleteWorkspaceDocument (account: Account, ancestors: readonly string[]): boolean {
  return hasAccountRole(account, AccountRole.User) && ancestors.includes('document:class:Document')
}
