import { AccountRole, type MeasureContext } from '@hcengineering/core'
import { checkJoin } from './operations'
import type { AccountDB } from './types'
import * as utils from './utils'

jest.mock('@hcengineering/server-token', () => ({
  decodeTokenVerbose: jest.fn().mockReturnValue({ account: 'member' }),
  generateToken: jest.fn()
}))

describe('checkJoin membership authority', () => {
  afterEach(() => jest.restoreAllMocks())

  it.each([AccountRole.Owner, AccountRole.ReadOnlyGuest])('preserves current %s role when reopening exhausted invites', async (role) => {
    const workspace = { uuid: 'workspace', url: 'workspace' }
    const db = {
      getWorkspaceRole: jest.fn().mockResolvedValue(role),
      updateWorkspaceRole: jest.fn()
    } as unknown as AccountDB
    jest.spyOn(utils, 'getWorkspaceInvite').mockResolvedValue({
      id: 'invite', workspaceUuid: workspace.uuid, role: AccountRole.User,
      remainingUses: 0, expiresOn: 1
    } as any)
    jest.spyOn(utils, 'getWorkspaceById').mockResolvedValue(workspace as any)
    const checkInvite = jest.spyOn(utils, 'checkInvite')
    const info = { role, token: 'workspace-token' }
    jest.spyOn(utils, 'selectWorkspace').mockResolvedValue(info as any)
    expect(await checkJoin({} as MeasureContext, db, null, 'token', { inviteId: 'invite' })).toEqual(info)
    expect(checkInvite).not.toHaveBeenCalled()
    expect(db.updateWorkspaceRole).not.toHaveBeenCalled()
  })
})
