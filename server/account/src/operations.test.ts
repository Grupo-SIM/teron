import { AccountRole, type MeasureContext } from '@hcengineering/core'
import { checkJoin, join } from './operations'
import type { AccountDB } from './types'
import * as utils from './utils'

jest.mock('@hcengineering/server-token', () => ({
  decodeTokenVerbose: jest.fn().mockReturnValue({ account: 'member' }),
  generateToken: jest.fn().mockReturnValue('session-token')
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


describe('join email confirmation from recipient-bound invite', () => {
  afterEach(() => jest.restoreAllMocks())

  it.each([true, false])('confirms existing account only for personalized invite: %s', async (personalized) => {
    const email = 'person@example.com'
    const socialId = { personUuid: 'member', verifiedOn: null as number | null }
    const db = {
      account: { findOne: jest.fn().mockResolvedValue({ uuid: 'member' }) },
      person: { findOne: jest.fn().mockResolvedValue({ firstName: 'Person', lastName: 'Test' }) }
    } as unknown as AccountDB
    jest.spyOn(utils, 'verifyPassword').mockReturnValue(true)
    jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(socialId as any)
    jest.spyOn(utils, 'resetFailedLoginAttempts').mockResolvedValue()
    const validate = jest.spyOn(utils, 'getWorkspaceJoinInfo').mockResolvedValue({
      email, workspace: { uuid: 'workspace' }, invite: { email: personalized ? email : undefined }
    } as any)
    const confirm = jest.spyOn(utils, 'confirmEmail').mockImplementation(async () => {
      socialId.verifiedOn = Date.now()
      return 'social-id' as any
    })
    jest.spyOn(utils, 'confirmHulyIds').mockResolvedValue()
    const joinWorkspace = jest.spyOn(utils, 'doJoinByInvite').mockResolvedValue({ token: 'workspace-token' } as any)
    const ctx = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as MeasureContext
    await join(ctx, db, null, '', { email, password: 'password', inviteId: 'invite', workspaceUrl: 'workspace' })
    expect(confirm).toHaveBeenCalledTimes(personalized ? 1 : 0)
    expect(joinWorkspace).toHaveBeenCalledTimes(personalized ? 1 : 0)
    if (personalized) expect(validate).toHaveBeenLastCalledWith(ctx, db, email, 'invite', 'workspace')
  })
})
