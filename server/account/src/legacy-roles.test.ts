import { AccountRole, readOnlyGuestAccountUuid, type AccountUuid, type WorkspaceUuid } from '@hcengineering/core'
import { convertLegacyReadOnlyMembers } from './legacy-roles'
import { getEntitlement } from './operations'
import type { AccountDB } from './types'
jest.mock('./operations', () => ({ getEntitlement: jest.fn() }))

const workspace = 'workspace' as WorkspaceUuid
function fixture (capacity: number): { db: AccountDB, roles: Map<AccountUuid, AccountRole> } {
  const roles = new Map<AccountUuid, AccountRole>([
    ['owner' as AccountUuid, AccountRole.Owner],
    ['first' as AccountUuid, AccountRole.ReadOnlyGuest],
    ['second' as AccountUuid, AccountRole.ReadOnlyGuest],
    [readOnlyGuestAccountUuid, AccountRole.ReadOnlyGuest]
  ])
  ;(getEntitlement as jest.Mock).mockResolvedValue({ accessMode: 'full', seatLimit: capacity })
  const db = {
    getWorkspaceMembers: async () => [...roles].map(([person, role]) => ({ person, role })),
    getWorkspaceRole: async (person: AccountUuid) => roles.get(person),
    updateWorkspaceRoleWithinCapacity: async (person: AccountUuid, _workspace: WorkspaceUuid, role: AccountRole, limit: number, expected: AccountRole) => {
      if (roles.get(person) !== expected || [...roles.values()].filter((value) => value === AccountRole.Owner || value === AccountRole.User).length >= limit) return false
      roles.set(person, role)
      return true
    }
  } as unknown as AccountDB
  return { db, roles }
}
describe('explicit legacy role migration', () => {
  it('converts only available seats, keeps backlog and skips anonymous guests', async () => {
    const { db, roles } = fixture(2)
    expect(await convertLegacyReadOnlyMembers(db, workspace)).toEqual({ converted: ['first'], pending: ['second'] })
    expect(await convertLegacyReadOnlyMembers(db, workspace)).toEqual({ converted: [], pending: ['second'] })
    expect(roles.get(readOnlyGuestAccountUuid)).toBe(AccountRole.ReadOnlyGuest)
  })
  it('allows every eligible account when capacity exists', async () => {
    const { db } = fixture(3)
    expect(await convertLegacyReadOnlyMembers(db, workspace)).toEqual({ converted: ['first', 'second'], pending: [] })
  })
  it('does not convert when workspace access is read-only', async () => {
    const { db } = fixture(3)
    ;(getEntitlement as jest.Mock).mockResolvedValue({ accessMode: 'read-only', seatLimit: 3 })
    expect(await convertLegacyReadOnlyMembers(db, workspace)).toEqual({ converted: [], pending: ['first', 'second'] })
  })
  it('repeated concurrent attempts cannot consume the last seat twice', async () => {
    const { db, roles } = fixture(2)
    await Promise.all([convertLegacyReadOnlyMembers(db, workspace), convertLegacyReadOnlyMembers(db, workspace)])
    expect([...roles.values()].filter((role) => role === AccountRole.User)).toHaveLength(1)
  })
})
