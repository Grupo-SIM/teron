import { AccountRole, readOnlyGuestAccountUuid, systemAccountUuid, type AccountUuid, type WorkspaceUuid } from '@hcengineering/core'
import { getEntitlement } from './operations'
import type { AccountDB } from './types'

/** Explicit migration entry point. It is never invoked automatically by account reads/startup. */
export async function convertLegacyReadOnlyMembers (
  db: AccountDB,
  workspace: WorkspaceUuid
): Promise<{ converted: AccountUuid[], pending: AccountUuid[] }> {
  const converted: AccountUuid[] = []
  const pending: AccountUuid[] = []
  const legacy = (await db.getWorkspaceMembers(workspace))
    .filter((member) => member.role === AccountRole.ReadOnlyGuest && member.person !== readOnlyGuestAccountUuid && member.person !== systemAccountUuid)
  for (const member of legacy) {
    // Re-read the contract for each reservation; adapters serialize capacity and source-role checks.
    const entitlement = await getEntitlement(db, workspace)
    const capacity = entitlement.seatLimit === undefined
      ? Number.MAX_SAFE_INTEGER
      : Math.min(entitlement.seatLimit, entitlement.nextSeatLimit ?? entitlement.seatLimit)
    if (entitlement.accessMode === 'full' && await db.updateWorkspaceRoleWithinCapacity(member.person, workspace, AccountRole.User, capacity, AccountRole.ReadOnlyGuest)) {
      converted.push(member.person)
    } else if (await db.getWorkspaceRole(member.person, workspace) === AccountRole.ReadOnlyGuest) {
      pending.push(member.person)
    }
  }
  return { converted, pending }
}
