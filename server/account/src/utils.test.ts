import { AccountRole, type AccountUuid, type MeasureContext } from '@hcengineering/core'
import type { AccountDB } from './types'
import { doJoinByInvite, getWorkspaceJoinInfo } from './utils'

describe('accepted workspace invite reentry', () => {
  const account = 'member' as AccountUuid
  const workspace = { uuid: 'workspace', url: 'workspace' }
  const ctx = { warn: jest.fn() } as unknown as MeasureContext

  function database (role: AccountRole | null, changes = {}): AccountDB {
    return {
      invite: {
        findOne: jest.fn().mockResolvedValue({
          id: 'invite', workspaceUuid: workspace.uuid, role: AccountRole.User,
          remainingUses: 0, expiresOn: 1, email: 'original@example.com', ...changes
        })
      },
      workspace: { findOne: jest.fn().mockResolvedValue(workspace) },
      getWorkspaceRole: jest.fn().mockResolvedValue(role)
    } as unknown as AccountDB
  }

  it('allows authenticated members through exhausted and expired invitations', async () => {
    const result = await getWorkspaceJoinInfo(ctx, database(AccountRole.Owner), 'changed@example.com', 'invite', '', account)
    expect(result.workspace).toEqual(workspace)
  })

  it('rejects exhausted invitations for authenticated nonmembers', async () => {
    await expect(getWorkspaceJoinInfo(ctx, database(null), 'original@example.com', 'invite', '', account)).rejects.toThrow()
  })

  it('rejects expired invitations for authenticated nonmembers', async () => {
    await expect(getWorkspaceJoinInfo(ctx, database(null, { remainingUses: 1 }), 'original@example.com', 'invite', '', account)).rejects.toThrow()
  })

  it('rejects mismatched email for authenticated nonmembers', async () => {
    await expect(getWorkspaceJoinInfo(ctx, database(null, { remainingUses: 1, expiresOn: -1 }), 'other@example.com', 'invite', '', account)).rejects.toThrow()
  })

  it('requires valid invitations before signup even when email belongs to a member', async () => {
    const db = database(AccountRole.Owner)
    await expect(getWorkspaceJoinInfo(ctx, db, 'original@example.com', 'invite', '')).rejects.toThrow()
    expect(db.getWorkspaceRole).not.toHaveBeenCalled()
  })
})


describe('joining an existing workspace membership', () => {
  it('does not consume or alter membership before selecting the workspace', async () => {
    const db = {
      getWorkspaceRole: jest.fn().mockResolvedValue(AccountRole.Owner),
      subscription: { find: jest.fn() },
      invite: { updateOne: jest.fn() },
      assignWorkspace: jest.fn(),
      updateWorkspaceRole: jest.fn(),
      consumeInviteAndAssignWorkspace: jest.fn()
    } as unknown as AccountDB
    // A deliberately invalid token stops workspace selection after the member
    // shortcut. Invitation writes and subscription checks must never be reached.
    await expect(doJoinByInvite({} as MeasureContext, db, null, 'invalid', 'member' as AccountUuid,
      { uuid: 'workspace', url: 'workspace' } as any,
      { id: 'invite', role: AccountRole.User, remainingUses: 0, expiresOn: 1 } as any)).rejects.toThrow()
    expect(db.subscription!.find).not.toHaveBeenCalled()
    expect(db.invite.updateOne).not.toHaveBeenCalled()
    expect(db.assignWorkspace).not.toHaveBeenCalled()
    expect(db.updateWorkspaceRole).not.toHaveBeenCalled()
    expect(db.consumeInviteAndAssignWorkspace).not.toHaveBeenCalled()
  })
})
