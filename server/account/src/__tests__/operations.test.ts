//
// Copyright © 2025 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import {
  readOnlyGuestAccountUuid,
  AccountRole,
  type PersonId,
  SocialIdType,
  type MeasureContext,
  type PersonUuid,
  type WorkspaceUuid,
  type AccountUuid,
  systemAccountUuid
} from '@hcengineering/core'
import platform, { PlatformError, Status, Severity, getMetadata } from '@hcengineering/platform'
import { decodeToken, decodeTokenVerbose } from '@hcengineering/server-token'

import * as utils from '../utils'
import * as simintpay from '../simintpay'
import { type AccountDB, type SocialId } from '../types'
import {
  createInvite,
  createInviteLink,
  createWorkspace,
  sendInvite,
  resendInvite,
  getLoginInfoByToken,
  releaseSocialId,
  loginAsGuest,
  loginOtp,
  login,
  confirm,
  signUp,
  signUpJoin,
  validateOtp,
  signUpOtp,
  restorePassword,
  requestPasswordReset,
  changePassword,
  getPerson,
  getSocialIds,
  getAccountInfo,
  createAccessLink,
  getSubscriptions,
  getWorkspaceEntitlement,
  getWorkspacePendingInvites,
  getInviteInfo,
  getWorkspaceSeatQuote,
  changeWorkspaceSeatLimit,
  cancelWorkspaceSubscription,
  uncancelWorkspaceSubscription,
  reconcileWorkspaceSeatChanges,
  leaveWorkspace,
  checkJoin,
  getWorkspaceCreationInfo
} from '../operations'
import { accountPlugin } from '../plugin'

// Mock platform
jest.mock('@hcengineering/platform', () => {
  const actual = jest.requireActual('@hcengineering/platform')
  return {
    ...actual,
    ...actual.default,
    getMetadata: jest.fn(),
    translate: jest.fn((id, params) => `${id} << ${JSON.stringify(params)}`)
  }
})

// Mock server-token
jest.mock('@hcengineering/server-token', () => ({
  decodeTokenVerbose: jest.fn(),
  decodeToken: jest.fn(),
  generateToken: jest.fn().mockImplementation((account, workspace, extra, _, options) => {
    let token = `mocked-token-${account}`
    if (workspace != null) {
      token += `-${workspace}`
    }
    if (options != null) {
      token += `-${JSON.stringify(options)}`
    }
    if (extra != null) {
      token += `-${JSON.stringify(extra)}`
    }
    return token
  })
}))

describe('account operations', () => {
  const mockCtx = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  } as unknown as MeasureContext

  const mockBranding = null

  const mockDb = {
    account: {
      findOne: jest.fn()
    },
    workspace: {
      findOne: jest.fn(),
      find: jest.fn()
    },
    invite: {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn()
    },
    subscription: {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      update: jest.fn()
    },
    subscriptionEvent: {
      insertOne: jest.fn()
    },
    workspaceSeatChange: {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      update: jest.fn()
    },
    claimFreeTrial: jest.fn().mockResolvedValue(true),
    setFreeTrialWorkspace: jest.fn(),
    releaseFreeTrial: jest.fn(),
    reserveSeatAndCreateInvite: jest.fn(),
    consumeInviteAndAssignWorkspace: jest.fn(),
    assignWorkspaceWithinCapacity: jest.fn(),
    updateWorkspaceRoleWithinCapacity: jest.fn(),
    getWorkspaceRole: jest.fn(),
    getWorkspaceMembers: jest.fn(),
    getAccountWorkspaces: jest.fn(),
    createWorkspace: jest.fn(),
    assignWorkspace: jest.fn(),
    unassignWorkspace: jest.fn(),
    updateWorkspaceRole: jest.fn(),
    person: {
      findOne: jest.fn()
    },
    socialId: {
      findOne: jest.fn(),
      find: jest.fn()
    },
    generatePersonUuid: jest.fn().mockResolvedValue('generated-person-uuid' as PersonUuid)
  } as unknown as AccountDB

  const mockToken = 'test-token'
  const mockAccount = { uuid: 'account-uuid' as PersonUuid }
  const mockWorkspace = {
    uuid: 'workspace-uuid' as WorkspaceUuid,
    name: 'Test Workspace',
    url: 'test-workspace',
    region: 'us'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockDb.subscription.find as jest.Mock).mockResolvedValue([
      {
        id: 'default-free-subscription',
        workspaceUuid: mockWorkspace.uuid,
        type: 'tier',
        status: 'trialing',
        plan: 'free',
        updatedOn: Date.now()
      }
    ])
    ;(mockDb.invite.find as jest.Mock).mockResolvedValue([])
    ;(mockDb.getWorkspaceMembers as jest.Mock).mockResolvedValue([])
    ;(mockDb.claimFreeTrial as jest.Mock).mockResolvedValue(true)
    ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
      account: mockAccount.uuid,
      workspace: mockWorkspace.uuid,
      extra: {}
    })
  })

  describe('createInvite', () => {
    test('should create invite for authorized maintainer', async () => {
      const inviteId = 'new-invite-id'
      const beforeTest = Date.now()
      const expectedExpiration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.invite.insertOne as jest.Mock).mockResolvedValue(inviteId)

      const result = await createInvite(mockCtx, mockDb, mockBranding, mockToken, {
        exp: expectedExpiration,
        email: 'test@example.com',
        limit: 1,
        role: AccountRole.User
      })

      const afterTest = Date.now()
      expect(result).toBe(inviteId)

      expect(mockDb.invite.insertOne).toHaveBeenCalledWith({
        workspaceUuid: mockWorkspace.uuid,
        expiresOn: expect.any(Number),
        email: 'test@example.com',
        remainingUses: 1,
        role: AccountRole.User,
        autoJoin: undefined
      })

      // Get the actual expiresOn value from the call
      const actualCall = (mockDb.invite.insertOne as jest.Mock).mock.calls[0][0]
      expect(actualCall.expiresOn).toBeGreaterThanOrEqual(beforeTest + expectedExpiration)
      expect(actualCall.expiresOn).toBeLessThanOrEqual(afterTest + expectedExpiration)
    })

    test('should throw error if caller role is insufficient', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.User)

      await expect(
        createInvite(mockCtx, mockDb, mockBranding, mockToken, {
          exp: 24 * 60 * 60 * 1000,
          email: 'test@example.com',
          limit: 1,
          role: AccountRole.Owner
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))
    })

    test('should atomically reserve a business seat for a personalized invite', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.subscription.find as jest.Mock).mockResolvedValue([
        {
          id: 'business-subscription',
          workspaceUuid: mockWorkspace.uuid,
          type: 'tier',
          status: 'active',
          plan: 'business',
          seatLimit: 4,
          nextSeatLimit: 3,
          updatedOn: Date.now()
        }
      ])
      ;(mockDb.reserveSeatAndCreateInvite as jest.Mock).mockResolvedValue('business-invite')

      const result = await createInvite(mockCtx, mockDb, mockBranding, mockToken, {
        exp: 60000,
        email: 'person@example.com',
        limit: 1,
        role: AccountRole.User
      })

      expect(result).toBe('business-invite')
      expect(mockDb.reserveSeatAndCreateInvite).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'person@example.com', remainingUses: 1 }),
        3
      )
      expect(mockDb.invite.insertOne).not.toHaveBeenCalled()
    })

    test('should reject generic business invite links', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.subscription.find as jest.Mock).mockResolvedValue([
        {
          id: 'business-subscription',
          workspaceUuid: mockWorkspace.uuid,
          type: 'tier',
          status: 'active',
          plan: 'business',
          seatLimit: 4,
          updatedOn: Date.now()
        }
      ])

      await expect(
        createInvite(mockCtx, mockDb, mockBranding, mockToken, {
          exp: 60000,
          emailMask: '.*',
          limit: 10,
          role: AccountRole.User
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {})))
    })
  })

  describe('getInviteInfo', () => {
    const invite = {
      id: 'invite-id',
      workspaceUuid: mockWorkspace.uuid,
      expiresOn: Date.now() + 60_000,
      email: 'invited@example.com',
      remainingUses: 1,
      role: AccountRole.User
    }

    test('should indicate signup for an invited email without an account', async () => {
      ;(mockDb.invite.findOne as jest.Mock).mockResolvedValue(invite)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.socialId.findOne as jest.Mock).mockResolvedValue(null)

      const result = await getInviteInfo(mockCtx, mockDb, mockBranding, mockToken, { inviteId: invite.id })

      expect(result).toEqual({
        workspaceName: mockWorkspace.name,
        email: invite.email,
        accountExists: false
      })
    })

    test('should indicate login for an invited email with an account', async () => {
      ;(mockDb.invite.findOne as jest.Mock).mockResolvedValue(invite)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.socialId.findOne as jest.Mock).mockResolvedValue({
        personUuid: mockAccount.uuid,
        type: SocialIdType.EMAIL,
        value: invite.email
      })
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)

      const result = await getInviteInfo(mockCtx, mockDb, mockBranding, mockToken, { inviteId: invite.id })

      expect(result.accountExists).toBe(true)
    })

    test('should not expose details for an expired invite', async () => {
      ;(mockDb.invite.findOne as jest.Mock).mockResolvedValue({ ...invite, expiresOn: Date.now() - 1 })

      const result = await getInviteInfo(mockCtx, mockDb, mockBranding, mockToken, { inviteId: invite.id })

      expect(result).toEqual({ workspaceName: null })
      expect(mockDb.workspace.findOne).not.toHaveBeenCalled()
      expect(mockDb.socialId.findOne).not.toHaveBeenCalled()
    })
  })

  describe('createWorkspace free trial', () => {
    beforeEach(() => {
      ;(mockDb.socialId.find as jest.Mock).mockResolvedValue([
        { _id: 'email:test@example.com', personUuid: mockAccount.uuid, verifiedOn: Date.now(), key: 'test@example.com' }
      ])
      ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
        uuid: mockAccount.uuid,
        firstName: 'Test',
        lastName: 'User'
      })
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.find as jest.Mock).mockResolvedValue([])
    })

    test('should reject a second lifetime free trial', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue({ ...mockAccount, freeTrialUsedOn: 1 })

      await expect(
        createWorkspace(mockCtx, mockDb, mockBranding, mockToken, { workspaceName: 'Second workspace' })
      ).rejects.toThrow(PlatformError)

      expect(mockDb.claimFreeTrial).not.toHaveBeenCalled()
    })

    test('should reject creation when another request atomically claimed the trial', async () => {
      ;(mockDb.claimFreeTrial as jest.Mock).mockResolvedValue(false)

      await expect(
        createWorkspace(mockCtx, mockDb, mockBranding, mockToken, { workspaceName: 'Concurrent workspace' })
      ).rejects.toThrow(PlatformError)

      expect(mockDb.createWorkspace).not.toHaveBeenCalled()
    })

    test('should create Free with an exact 30-day server-side trial', async () => {
      const startedOn = 10_000_000
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(startedOn)
      ;(getMetadata as jest.Mock).mockImplementation((key) => {
        if (key === accountPlugin.metadata.Transactors) return 'http://internal;http://external;'
        return undefined
      })
      ;(mockDb.createWorkspace as jest.Mock).mockResolvedValue(mockWorkspace.uuid)

      await createWorkspace(mockCtx, mockDb, mockBranding, mockToken, { workspaceName: 'First workspace' })

      const trialEnd = startedOn + 30 * 24 * 60 * 60 * 1000
      const [subscription] = (mockDb.subscription.insertOne as jest.Mock).mock.calls[0]
      expect(subscription).toEqual(
        expect.objectContaining({
          workspaceUuid: expect.any(String),
          plan: 'free',
          status: 'trialing',
          periodStart: startedOn,
          periodEnd: trialEnd,
          trialEnd
        })
      )
      expect(subscription.workspaceUuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
      expect(mockDb.createWorkspace).toHaveBeenCalledWith(expect.objectContaining({ uuid: subscription.workspaceUuid }), expect.anything())
      expect(mockDb.assignWorkspace).toHaveBeenCalledWith(mockAccount.uuid, subscription.workspaceUuid, AccountRole.Owner)
      expect(mockDb.setFreeTrialWorkspace).toHaveBeenCalledWith(mockAccount.uuid, subscription.workspaceUuid)
      nowSpy.mockRestore()
    })
  })

  describe('getWorkspaceCreationInfo', () => {
    test('keeps Free available when the user is only a workspace member', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.find as jest.Mock).mockResolvedValue([])
      ;(mockDb.getAccountWorkspaces as jest.Mock).mockResolvedValue([mockWorkspace])

      const result = await getWorkspaceCreationInfo(mockCtx, mockDb, mockBranding, mockToken)

      expect(result).toEqual({ freeTrialAvailable: true })
      expect(mockDb.workspace.find).toHaveBeenCalledWith({ createdBy: mockAccount.uuid })
      expect(mockDb.getAccountWorkspaces).not.toHaveBeenCalled()
    })

    test('makes Free unavailable after the user creates a workspace', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.find as jest.Mock).mockResolvedValue([mockWorkspace])

      const result = await getWorkspaceCreationInfo(mockCtx, mockDb, mockBranding, mockToken)

      expect(result).toEqual({ freeTrialAvailable: false })
    })
  })

  describe('getWorkspaceEntitlement', () => {
    test('should become read-only exactly at the free trial boundary', async () => {
      const boundary = 2_000_000
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(boundary)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Owner)
      ;(mockDb.subscription.find as jest.Mock).mockResolvedValue([
        {
          id: 'free-subscription',
          workspaceUuid: mockWorkspace.uuid,
          type: 'tier',
          status: 'trialing',
          plan: 'free',
          periodStart: boundary - 30 * 24 * 60 * 60 * 1000,
          periodEnd: boundary,
          trialEnd: boundary,
          updatedOn: boundary - 1
        }
      ])

      const result = await getWorkspaceEntitlement(mockCtx, mockDb, mockBranding, mockToken, {})

      expect(result).toEqual(
        expect.objectContaining({ plan: 'free', accessMode: 'read-only', readOnlyAfter: boundary })
      )
      nowSpy.mockRestore()
    })

    test('should count members and only valid personalized pending invites', async () => {
      const now = 3_000_000
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Owner)
      ;(mockDb.getWorkspaceMembers as jest.Mock).mockResolvedValue([
        { role: AccountRole.Owner },
        { role: AccountRole.User },
        { role: AccountRole.ReadOnlyGuest }
      ])
      ;(mockDb.invite.find as jest.Mock).mockResolvedValue([
        { email: 'pending@example.com', expiresOn: -1, remainingUses: 1 },
        { email: 'expired@example.com', expiresOn: now - 1, remainingUses: 1 },
        { expiresOn: now + 1000, remainingUses: 10 }
      ])
      ;(mockDb.subscription.find as jest.Mock).mockResolvedValue([
        {
          id: 'business-subscription',
          workspaceUuid: mockWorkspace.uuid,
          type: 'tier',
          status: 'active',
          plan: 'business',
          seatLimit: 5,
          nextSeatLimit: 4,
          periodEnd: now + 10000,
          updatedOn: now - 1
        }
      ])

      const result = await getWorkspaceEntitlement(mockCtx, mockDb, mockBranding, mockToken, {})

      expect(result).toEqual(
        expect.objectContaining({
          plan: 'business',
          accessMode: 'full',
          seatLimit: 5,
          nextSeatLimit: 4,
          memberSeats: 1,
          pendingInviteSeats: 1,
          availableSeats: 2
        })
      )
      nowSpy.mockRestore()
    })

    test('should prioritize Unlimited over other active tier subscriptions', async () => {
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Owner)
      ;(mockDb.subscription.find as jest.Mock).mockResolvedValue([
        {
          id: 'unlimited-subscription',
          workspaceUuid: mockWorkspace.uuid,
          type: 'tier',
          status: 'active',
          plan: 'unlimited',
          updatedOn: 1
        },
        {
          id: 'newer-business-subscription',
          workspaceUuid: mockWorkspace.uuid,
          type: 'tier',
          status: 'active',
          plan: 'business',
          seatLimit: 1,
          periodEnd: Date.now() - 1,
          updatedOn: 2
        }
      ])

      const result = await getWorkspaceEntitlement(mockCtx, mockDb, mockBranding, mockToken, {})

      expect(result).toEqual(
        expect.objectContaining({
          plan: 'unlimited',
          status: 'active',
          accessMode: 'full',
          seatLimit: undefined,
          availableSeats: undefined,
          readOnlyAfter: undefined
        })
      )
    })
  })

  describe('workspace seat billing', () => {
    beforeEach(() => {
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Owner)
      ;(mockDb.getWorkspaceMembers as jest.Mock).mockResolvedValue([
        { person: mockAccount.uuid, role: AccountRole.Owner }
      ])
      ;(mockDb.subscription.find as jest.Mock).mockResolvedValue([
        {
          id: 'business-subscription', workspaceUuid: mockWorkspace.uuid, type: 'tier', status: 'active',
          plan: 'business', provider: 'simintpay', seatLimit: 1, updatedOn: 1
        }
      ])
      ;(mockDb.subscription.findOne as jest.Mock).mockResolvedValue({
        id: 'business-subscription', workspaceUuid: mockWorkspace.uuid, type: 'tier', provider: 'simintpay'
      })
      ;(mockDb.workspaceSeatChange.findOne as jest.Mock).mockResolvedValue(null)
    })

    test('lists only valid personalized pending invites', async () => {
      const now = Date.now()
      ;(mockDb.invite.find as jest.Mock).mockResolvedValue([
        { id: 'a', email: 'a@example.com', role: AccountRole.User, expiresOn: now + 1000, remainingUses: 1 },
        { id: 'b', email: 'b@example.com', role: AccountRole.User, expiresOn: now - 1, remainingUses: 1 },
        { id: 'c', role: AccountRole.User, expiresOn: -1, remainingUses: 5 }
      ])

      await expect(getWorkspacePendingInvites(mockCtx, mockDb, mockBranding, mockToken)).resolves.toEqual([
        expect.objectContaining({ id: 'a', email: 'a@example.com' })
      ])
    })

    test('quotes an immediate prorated increase from authoritative contract data', async () => {
      const now = Date.now()
      const day = 24 * 60 * 60 * 1000
      const dateNow = jest.spyOn(Date, 'now').mockReturnValue(now)
      jest.spyOn(simintpay, 'getWorkspaceBillingContract').mockResolvedValue({
        id: 'contract', quantity: 1, pendingQuantity: null, version: 2, unitAmount: '10.00',
        recurringAmount: '10.00', currentPeriodStart: new Date(now - 4 * day).toISOString(),
        currentPeriodEnd: new Date(now + 26 * day).toISOString()
      })

      const quote = await getWorkspaceSeatQuote(mockCtx, mockDb, mockBranding, mockToken, { targetSeatLimit: 2 })
      dateNow.mockRestore()

      expect(quote.nextRecurringAmount).toBe('20.00')
      expect(quote.estimatedProrationAmount).toBe('8.67')
      expect(quote).toMatchObject({ prorationDays: 26, prorationPeriodDays: 30 })
    })

    test('applies paid capacity and stores the idempotent operation', async () => {
      const now = Date.now()
      jest.spyOn(simintpay, 'getWorkspaceBillingContract').mockResolvedValue({
        id: 'contract', quantity: 1, pendingQuantity: null, version: 2, unitAmount: '10.00',
        recurringAmount: '10.00', currentPeriodStart: new Date(now - 5000).toISOString(),
        currentPeriodEnd: new Date(now + 5000).toISOString()
      })
      jest.spyOn(simintpay, 'requestWorkspaceQuantityChange').mockResolvedValue({
        id: 'provider-change', contractId: 'contract', status: 'APPLIED', previousQuantity: 1,
        targetQuantity: 2, effectiveQuantity: 2, scheduledFor: null, prorationAmount: '5.00',
        nextRecurringAmount: '20.00', failureCode: null, failureMessage: null
      })

      const result = await changeWorkspaceSeatLimit(mockCtx, mockDb, mockBranding, mockToken, {
        targetSeatLimit: 2, operationId: 'operation-1'
      })

      expect(result.status).toBe('APPLIED')
      expect(mockDb.workspaceSeatChange.insertOne).toHaveBeenCalledWith(expect.objectContaining({ id: 'operation-1' }))
      expect(mockDb.subscription.update).toHaveBeenCalledWith(
        { id: 'business-subscription' }, expect.objectContaining({ seatLimit: 2 })
      )
    })

    test('cancels a Simintpay workspace subscription at the current period end', async () => {
      const periodStart = new Date('2026-08-16T00:00:00.000Z')
      const periodEnd = new Date('2026-09-16T00:00:00.000Z')
      ;(mockDb.subscription.findOne as jest.Mock).mockResolvedValue({
        id: 'legacy-provider-subscription', workspaceUuid: mockWorkspace.uuid, type: 'tier', provider: 'simintpay',
        status: 'active', plan: 'business', providerData: { quantity: 1 }
      })
      jest.spyOn(simintpay, 'getWorkspaceBillingContract').mockResolvedValue({
        id: 'billing-contract', quantity: 1, pendingQuantity: null, version: 2, unitAmount: '10.00',
        recurringAmount: '10.00', currentPeriodStart: periodStart.toISOString(), currentPeriodEnd: periodEnd.toISOString()
      })
      jest.spyOn(simintpay, 'cancelWorkspaceBillingContract').mockResolvedValue({
        id: 'billing-contract', quantity: 1, pendingQuantity: null, version: 2, unitAmount: '10.00',
        recurringAmount: '10.00', currentPeriodStart: periodStart.toISOString(), currentPeriodEnd: periodEnd.toISOString()
      })

      const result = await cancelWorkspaceSubscription(mockCtx, mockDb, mockBranding, mockToken)

      expect(simintpay.cancelWorkspaceBillingContract).toHaveBeenCalledWith('billing-contract')
      expect(mockDb.subscription.update).toHaveBeenCalledWith(
        { id: 'legacy-provider-subscription' },
        expect.objectContaining({ willCancelAt: periodEnd.getTime(), providerData: expect.objectContaining({ cancelAtPeriodEnd: true }) })
      )
      expect(result.willCancelAt).toBe(periodEnd.getTime())
    })

    test('reactivates a canceled Simintpay workspace subscription', async () => {
      const periodStart = new Date('2026-08-16T00:00:00.000Z')
      const periodEnd = new Date('2026-09-16T00:00:00.000Z')
      ;(mockDb.subscription.findOne as jest.Mock).mockResolvedValue({
        id: 'legacy-provider-subscription', workspaceUuid: mockWorkspace.uuid, type: 'tier', provider: 'simintpay',
        status: 'active', plan: 'business', willCancelAt: periodEnd.getTime(), providerData: { cancelAtPeriodEnd: true }
      })
      jest.spyOn(simintpay, 'getWorkspaceBillingContract').mockResolvedValue({
        id: 'billing-contract', quantity: 1, pendingQuantity: null, version: 3, unitAmount: '10.00',
        recurringAmount: '10.00', currentPeriodStart: periodStart.toISOString(), currentPeriodEnd: periodEnd.toISOString()
      })
      jest.spyOn(simintpay, 'reactivateWorkspaceBillingContract').mockResolvedValue({
        id: 'billing-contract', quantity: 1, pendingQuantity: null, version: 3, unitAmount: '10.00',
        recurringAmount: '10.00', currentPeriodStart: periodStart.toISOString(), currentPeriodEnd: periodEnd.toISOString()
      })

      const result = await uncancelWorkspaceSubscription(mockCtx, mockDb, mockBranding, mockToken)

      expect(simintpay.reactivateWorkspaceBillingContract).toHaveBeenCalledWith('billing-contract')
      expect(mockDb.subscription.update).toHaveBeenCalledWith(
        { id: 'legacy-provider-subscription' },
        expect.objectContaining({ willCancelAt: undefined, providerData: expect.objectContaining({ cancelAtPeriodEnd: false }) })
      )
      expect(result.willCancelAt).toBeUndefined()
    })

    test('rejects a reduction below members and pending invitations', async () => {
      ;(mockDb.invite.find as jest.Mock).mockResolvedValue([
        { id: 'a', email: 'a@example.com', role: AccountRole.User, expiresOn: -1, remainingUses: 1 }
      ])

      await expect(changeWorkspaceSeatLimit(mockCtx, mockDb, mockBranding, mockToken, {
        targetSeatLimit: 1, operationId: 'operation-2'
      })).rejects.toThrow(PlatformError)
    })

    test('reconciles pending provider operations and applies capacity', async () => {
      ;(mockDb.workspaceSeatChange.find as jest.Mock).mockResolvedValue([
        {
          id: 'operation-3', workspaceUuid: mockWorkspace.uuid, accountUuid: mockAccount.uuid,
          contractId: 'contract', providerChangeId: 'provider-change', status: 'PENDING_PAYMENT',
          previousSeatLimit: 1, targetSeatLimit: 2, createdOn: 1, updatedOn: 1
        }
      ])
      jest.spyOn(simintpay, 'getWorkspaceQuantityChange').mockResolvedValue({
        id: 'provider-change', contractId: 'contract', status: 'APPLIED', previousQuantity: 1,
        targetQuantity: 2, effectiveQuantity: 2, scheduledFor: null, prorationAmount: '5.00',
        nextRecurringAmount: '20.00', failureCode: null, failureMessage: null
      })

      await reconcileWorkspaceSeatChanges(mockCtx, mockDb)

      expect(mockDb.subscription.update).toHaveBeenCalledWith(
        { id: 'business-subscription' }, expect.objectContaining({ seatLimit: 2 })
      )
      expect(mockDb.workspaceSeatChange.update).toHaveBeenCalledWith(
        { id: 'operation-3' }, expect.objectContaining({ status: 'APPLIED' })
      )
    })
  })

  describe('createInviteLink', () => {
    const frontUrl = 'https://app.example.com'

    beforeEach(() => {
      ;(getMetadata as jest.Mock).mockImplementation((key) => {
        if (key === accountPlugin.metadata.FrontURL) return frontUrl
        return undefined
      })
    })

    test('should create basic invite link', async () => {
      const inviteId = 'new-invite-id'
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.invite.insertOne as jest.Mock).mockResolvedValue(inviteId)

      const result = await createInviteLink(mockCtx, mockDb, mockBranding, mockToken, {
        email: 'test@example.com',
        role: AccountRole.User
      })

      expect(result).toBe(`${frontUrl}/entrar?mode=join&inviteId=${inviteId}`)
    })

    test('should create link with auto-join parameters', async () => {
      const inviteId = 'new-invite-id'
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.invite.insertOne as jest.Mock).mockResolvedValue(inviteId)
      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        account: mockAccount.uuid,
        workspace: mockWorkspace.uuid,
        extra: { service: 'schedule' }
      })

      const result = await createInviteLink(mockCtx, mockDb, mockBranding, mockToken, {
        email: 'test@example.com',
        role: AccountRole.User,
        autoJoin: true,
        firstName: 'John',
        lastName: 'Doe'
      })

      expect(result).toBe(`${frontUrl}/entrar?mode=join&inviteId=${inviteId}&autoJoin&firstName=John&lastName=Doe`)
    })

    test('should create link with redirect parameter', async () => {
      const inviteId = 'new-invite-id'
      const navigateUrl = '/workspace/calendar'
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.invite.insertOne as jest.Mock).mockResolvedValue(inviteId)

      const result = await createInviteLink(mockCtx, mockDb, mockBranding, mockToken, {
        email: 'test@example.com',
        role: AccountRole.User,
        navigateUrl
      })

      expect(result).toBe(`${frontUrl}/entrar?mode=join&inviteId=${inviteId}&navigateUrl=${encodeURIComponent(navigateUrl)}`)
    })

    test('should create link with all parameters', async () => {
      const inviteId = 'new-invite-id'
      const navigateUrl = '/workspace/settings?tab=members'
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.invite.insertOne as jest.Mock).mockResolvedValue(inviteId)
      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        account: mockAccount.uuid,
        workspace: mockWorkspace.uuid,
        extra: { service: 'schedule' }
      })

      const result = await createInviteLink(mockCtx, mockDb, mockBranding, mockToken, {
        email: 'test@example.com',
        role: AccountRole.User,
        autoJoin: true,
        firstName: 'John',
        lastName: 'Doe',
        navigateUrl
      })

      expect(result).toBe(
        `${frontUrl}/entrar?mode=join&inviteId=${inviteId}&autoJoin&firstName=John&lastName=Doe&navigateUrl=${encodeURIComponent(navigateUrl)}`
      )
    })

    // Negative scenarios
    test('should throw error for auto-join without firstName', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        account: mockAccount.uuid,
        workspace: mockWorkspace.uuid,
        extra: { service: 'schedule' }
      })

      await expect(
        createInviteLink(mockCtx, mockDb, mockBranding, mockToken, {
          email: 'test@example.com',
          role: AccountRole.User,
          autoJoin: true
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {})))
    })

    test('should throw error for auto-join without schedule service', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        account: mockAccount.uuid,
        workspace: mockWorkspace.uuid,
        extra: { service: 'other' }
      })

      await expect(
        createInviteLink(mockCtx, mockDb, mockBranding, mockToken, {
          email: 'test@example.com',
          role: AccountRole.User,
          autoJoin: true,
          firstName: 'John'
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))
    })

    test('should throw error for insufficient role', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.DocGuest)

      await expect(
        createInviteLink(mockCtx, mockDb, mockBranding, mockToken, {
          email: 'test@example.com',
          role: AccountRole.User
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))
    })
  })

  describe('sendInvite', () => {
    const mockEmail = 'test@example.com'
    const sesUrl = 'https://ses.example.com'
    const sesAuth = 'test-auth-token'

    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true })
      ;(getMetadata as jest.Mock).mockImplementation((key) => {
        switch (key) {
          case accountPlugin.metadata.MAIL_URL:
            return sesUrl
          case accountPlugin.metadata.MAIL_AUTH_TOKEN:
            return sesAuth
          case accountPlugin.metadata.FrontURL:
            return 'https://app.example.com'
          default:
            return undefined
        }
      })
    })

    test('should send invite email with correct parameters', async () => {
      const inviteId = 'new-invite-id'
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.invite.insertOne as jest.Mock).mockResolvedValue(inviteId)

      await sendInvite(mockCtx, mockDb, mockBranding, mockToken, {
        email: mockEmail,
        role: AccountRole.User,
        expHours: 48
      })

      expect(global.fetch).toHaveBeenCalledWith(`${sesUrl}/send`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sesAuth}`
        },
        body: expect.stringContaining(mockEmail)
      })

      // Verify invite was created with correct parameters
      expect(mockDb.invite.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockEmail,
          remainingUses: 1,
          role: AccountRole.User,
          expiresOn: expect.any(Number)
        })
      )
    })

    test('should throw error if caller has insufficient role', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.DocGuest)

      await expect(
        sendInvite(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          role: AccountRole.User
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))

      expect(global.fetch).not.toHaveBeenCalled()
    })

    test('should throw error if workspace not found', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(null)

      await expect(
        sendInvite(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          role: AccountRole.User
        })
      ).rejects.toThrow(
        new PlatformError(
          new Status(Severity.ERROR, platform.status.WorkspaceNotFound, { workspaceUuid: mockWorkspace.uuid })
        )
      )

      expect(global.fetch).not.toHaveBeenCalled()
    })

    test('should throw error if account not found', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(null)

      await expect(
        sendInvite(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          role: AccountRole.User
        })
      ).rejects.toThrow(
        new PlatformError(new Status(Severity.ERROR, platform.status.AccountNotFound, { account: mockAccount.uuid }))
      )

      expect(global.fetch).not.toHaveBeenCalled()
    })

    test('should use custom expiration hours', async () => {
      const inviteId = 'new-invite-id'
      const customExpHours = 72
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.invite.insertOne as jest.Mock).mockResolvedValue(inviteId)

      const beforeTest = Date.now()
      await sendInvite(mockCtx, mockDb, mockBranding, mockToken, {
        email: mockEmail,
        role: AccountRole.User,
        expHours: customExpHours
      })
      const afterTest = Date.now()

      const actualCall = (mockDb.invite.insertOne as jest.Mock).mock.calls[0][0]
      const expectedExpiration = customExpHours * 60 * 60 * 1000

      // Check if expiration time is within the expected range
      const minExpected = beforeTest + expectedExpiration
      const maxExpected = afterTest + expectedExpiration

      expect(actualCall.expiresOn).toBeGreaterThanOrEqual(minExpected - 1) // Allow 1ms tolerance
      expect(actualCall.expiresOn).toBeLessThanOrEqual(maxExpected)
    })
  })

  describe('resendInvite', () => {
    const mockEmail = 'test@example.com'

    test('should resend existing invite', async () => {
      const existingInvite = {
        id: 'existing-invite-id',
        workspaceUuid: mockWorkspace.uuid,
        email: mockEmail
      }
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.invite.findOne as jest.Mock).mockResolvedValue(existingInvite)
      global.fetch = jest.fn().mockResolvedValue({ ok: true })

      await resendInvite(mockCtx, mockDb, mockBranding, mockToken, { email: mockEmail, role: AccountRole.User })

      expect(mockDb.invite.update).toHaveBeenCalledWith(
        { id: existingInvite.id },
        expect.objectContaining({
          expiresOn: expect.any(Number),
          remainingUses: 1,
          role: AccountRole.User
        })
      )
      expect(global.fetch).toHaveBeenCalled()
    })

    test('should create new invite if none exists', async () => {
      const newInviteId = 'new-invite-id'
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)
      ;(mockDb.invite.findOne as jest.Mock).mockResolvedValue(null)
      ;(mockDb.invite.insertOne as jest.Mock).mockResolvedValue(newInviteId)
      global.fetch = jest.fn().mockResolvedValue({ ok: true })

      await resendInvite(mockCtx, mockDb, mockBranding, mockToken, { email: mockEmail, role: AccountRole.User })

      expect(mockDb.invite.insertOne).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('getLoginInfoByToken', () => {
    const mockCtx = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
    } as unknown as MeasureContext

    const mockBranding = null
    const mockToken = 'test-token'
    const mockPersonId = 'test-person-id'

    const mockDb = {
      account: {
        findOne: jest.fn(),
        insertOne: jest.fn()
      },
      accountEvent: {
        insertOne: jest.fn()
      },
      workspace: {
        findOne: jest.fn()
      },
      person: {
        findOne: jest.fn()
      },
      socialId: {
        findOne: jest.fn(),
        find: jest.fn(),
        insertOne: jest.fn(),
        update: jest.fn()
      },
      userProfile: {
        insertOne: jest.fn()
      },
      getWorkspaceRole: jest.fn(),
      assignWorkspace: jest.fn(),
      updateWorkspaceRole: jest.fn(),
      generatePersonUuid: jest.fn()
    } as unknown as AccountDB

    beforeEach(() => {
      jest.clearAllMocks()
      // Mock the metadata for endpoints
      ;(getMetadata as jest.Mock).mockImplementation((key) => {
        if (key === accountPlugin.metadata.Transactors) {
          return 'ws://external:3000;ws://external:3000;eu,ws://internal:3000;ws://internal:3000;us'
        }
        return undefined
      })
    })

    describe('endpoint selection', () => {
      const mockWorkspaceEu = {
        uuid: 'workspace-uuid' as WorkspaceUuid,
        name: 'Test Workspace',
        url: 'test-workspace',
        region: 'eu'
      }

      const mockPerson = {
        uuid: mockPersonId as PersonUuid,
        firstName: 'John',
        lastName: 'Doe'
      }

      beforeEach(() => {
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)
        ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.User)
        ;(mockDb.socialId.find as jest.Mock).mockResolvedValue([{ _id: 'social-id-1' }])
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockPersonId,
          workspace: mockWorkspaceEu.uuid,
          extra: {}
        })
      })

      test('should return login info with external endpoint when clientNetworkPosition is external', async () => {
        ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspaceEu)

        const result = await getLoginInfoByToken(
          mockCtx,
          mockDb,
          mockBranding,
          mockToken,
          {},
          {
            clientNetworkPosition: 'external'
          }
        )

        expect(result).toEqual({
          account: mockPersonId,
          name: 'John Doe',
          socialId: 'social-id-1',
          token: 'mocked-token-test-person-id-workspace-uuid-{}-{}',
          workspace: mockWorkspaceEu.uuid,
          workspaceUrl: 'test-workspace',
          endpoint: 'ws://external:3000',
          role: AccountRole.User
        })
      })

      test('should return login info with internal endpoint when clientNetworkPosition is internal', async () => {
        const mockWorkspaceUs = {
          ...mockWorkspaceEu,
          region: 'us'
        }
        ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspaceUs)

        const result = await getLoginInfoByToken(
          mockCtx,
          mockDb,
          mockBranding,
          mockToken,
          {},
          {
            clientNetworkPosition: 'internal'
          }
        )

        expect(result).toEqual({
          account: mockPersonId,
          name: 'John Doe',
          socialId: 'social-id-1',
          token: 'mocked-token-test-person-id-workspace-uuid-{}-{}',
          workspace: mockWorkspaceUs.uuid,
          workspaceUrl: 'test-workspace',
          endpoint: 'ws://internal:3000',
          role: AccountRole.User
        })
      })

      test('should default to external endpoint when clientNetworkPosition is not provided', async () => {
        ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspaceEu)

        const result = await getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken, {})

        expect(result).toEqual({
          account: mockPersonId,
          name: 'John Doe',
          socialId: 'social-id-1',
          token: 'mocked-token-test-person-id-workspace-uuid-{}-{}',
          workspace: mockWorkspaceEu.uuid,
          workspaceUrl: 'test-workspace',
          endpoint: 'ws://external:3000',
          role: AccountRole.User
        })
      })
    })

    test('should return login info without workspace when no workspace in token', async () => {
      const mockPerson = {
        uuid: mockPersonId as PersonUuid,
        firstName: 'John',
        lastName: 'Doe'
      }

      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        account: mockPersonId,
        workspace: undefined,
        extra: {}
      })
      ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)
      ;(mockDb.socialId.find as jest.Mock).mockResolvedValue([{ _id: 'social-id-1' }])

      const result = await getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken, {})

      expect(result).toEqual({
        account: mockPersonId,
        name: 'John Doe',
        socialId: 'social-id-1',
        token: 'mocked-token-test-person-id-{}-{}'
      })
    })

    test('should throw error when workspace not found', async () => {
      const mockWorkspace = {
        uuid: 'workspace-uuid' as WorkspaceUuid
      }

      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        account: mockPersonId,
        workspace: mockWorkspace.uuid,
        extra: {}
      })
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(null)
      ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
        uuid: mockPersonId,
        firstName: 'John',
        lastName: 'Doe'
      })
      ;(mockDb.socialId.find as jest.Mock).mockResolvedValue([{ _id: 'social-id-1' }])

      await expect(getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken, {})).rejects.toThrow(
        new PlatformError(
          new Status(Severity.ERROR, platform.status.WorkspaceNotFound, { workspaceUuid: mockWorkspace.uuid })
        )
      )
    })

    test('should use sub claim as account when provided', async () => {
      const subAccount = 'sub-account-uuid' as AccountUuid
      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        account: mockAccount.uuid,
        workspace: mockWorkspace.uuid,
        extra: {},
        sub: subAccount
      })
      ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
        uuid: subAccount,
        firstName: 'Sub',
        lastName: 'User'
      })
      ;(mockDb.socialId.find as jest.Mock).mockResolvedValue([{ _id: 'social-id-1' }])
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.User)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)

      const result = await getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)

      expect(result).toEqual({
        account: subAccount, // Should use sub instead of account
        name: 'Sub User',
        socialId: 'social-id-1',
        token: expect.stringContaining(`"sub":"${subAccount}"`),
        workspace: mockWorkspace.uuid,
        workspaceUrl: mockWorkspace.url,
        endpoint: expect.any(String),
        role: AccountRole.User
      })
    })

    describe('with grants', () => {
      const grantWorkspace = {
        uuid: 'grant-workspace-uuid' as WorkspaceUuid,
        name: 'Grant Workspace',
        url: 'grant-workspace-url',
        region: 'us'
      }

      const grantRole = AccountRole.User
      const grantAccount = 'grant-account' as AccountUuid
      const grantFirstName = 'Grant'
      const grantLastName = 'User'
      const mockTokenObj = {
        account: grantAccount,
        workspace: undefined,
        extra: {},
        grant: {
          workspace: grantWorkspace.uuid,
          role: grantRole,
          firstName: grantFirstName,
          lastName: grantLastName
        }
      }

      beforeEach(() => {
        jest.clearAllMocks()
        ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(grantWorkspace)
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue(mockTokenObj)
      })

      test('should create automatic account when grant for new account', async () => {
        // Mock account doesn't exist yet
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(null)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
          uuid: grantAccount,
          firstName: grantFirstName,
          lastName: grantLastName
        })

        const result = await getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)

        expect(mockDb.assignWorkspace).toHaveBeenCalledWith(grantAccount, grantWorkspace.uuid, grantRole)
        expect(result).toEqual({
          account: grantAccount,
          name: `${grantFirstName} ${grantLastName}`,
          token: expect.stringContaining(grantAccount),
          workspace: grantWorkspace.uuid,
          workspaceUrl: grantWorkspace.url,
          endpoint: expect.any(String),
          socialId: 'social-id-1',
          role: grantRole
        })
      })

      test('should request firstName/lastName if not provided for new account', async () => {
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(null)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(null)
        delete (mockTokenObj.grant as any).firstName

        const result = await getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)

        expect(result).toEqual({
          request: true,
          lastName: grantLastName
        })
      })

      test('should use existing automatic account with grant', async () => {
        const existingAutomaticAccount = {
          uuid: grantAccount,
          automatic: true
        }
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(existingAutomaticAccount)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
          uuid: grantAccount,
          firstName: grantFirstName,
          lastName: grantLastName
        })
        ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.User)

        const result = await getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)

        expect(mockDb.updateWorkspaceRole).toHaveBeenCalledWith(grantAccount, grantWorkspace.uuid, grantRole)
        expect(result).toEqual({
          account: grantAccount,
          name: `${grantFirstName} ${grantLastName}`,
          token: expect.stringContaining(grantAccount),
          socialId: 'social-id-1',
          workspace: grantWorkspace.uuid,
          workspaceUrl: grantWorkspace.url,
          endpoint: expect.any(String),
          role: AccountRole.User
        })
      })

      test('should return null for grant with existing non-automatic account', async () => {
        const existingAccount = {
          uuid: grantAccount,
          automatic: false
        }
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(existingAccount)

        const result = await getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)

        expect(result).toBeNull()
        expect(mockDb.assignWorkspace).not.toHaveBeenCalled()
      })

      test('should generate UUID and use as sub when grant present without sub', async () => {
        const generatedUuid = 'generated-uuid' as AccountUuid
        const grant = {
          workspace: mockWorkspace.uuid,
          role: AccountRole.User,
          firstName: 'John',
          lastName: 'Doe'
        }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: utils.GUEST_ACCOUNT,
          extra: {},
          grant
        })
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(null)
        ;(mockDb.generatePersonUuid as jest.Mock).mockResolvedValue(generatedUuid)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
          uuid: generatedUuid,
          firstName: 'John',
          lastName: 'Doe'
        })
        ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
        ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.User)

        const result = await getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)

        expect(mockDb.generatePersonUuid).toHaveBeenCalled()
        expect(result).toEqual({
          account: generatedUuid,
          name: 'John Doe',
          socialId: 'social-id-1',
          token: expect.stringContaining(`"sub":"${generatedUuid}"`),
          workspace: mockWorkspace.uuid,
          workspaceUrl: mockWorkspace.url,
          endpoint: expect.any(String),
          role: AccountRole.User
        })
      })

      test('should use existing sub', async () => {
        const existingUuid = 'existing-uuid' as AccountUuid
        const grant = {
          workspace: mockWorkspace.uuid,
          role: AccountRole.User,
          firstName: 'John',
          lastName: 'Doe'
        }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: utils.GUEST_ACCOUNT,
          extra: {},
          grant,
          sub: existingUuid
        })
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(null)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
          uuid: existingUuid,
          firstName: 'John',
          lastName: 'Doe'
        })
        ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
        ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.User)

        const result = await getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)

        expect(mockDb.generatePersonUuid).not.toHaveBeenCalled()
        expect(result).toEqual({
          account: existingUuid,
          name: 'John Doe',
          socialId: 'social-id-1',
          token: expect.stringContaining(`"sub":"${existingUuid}"`),
          workspace: mockWorkspace.uuid,
          workspaceUrl: mockWorkspace.url,
          endpoint: expect.any(String),
          role: AccountRole.User
        })
      })

      test('should throw error for grant with system account', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: utils.GUEST_ACCOUNT,
          extra: {},
          grant: { workspace: grantWorkspace.uuid, role: grantRole },
          sub: systemAccountUuid
        })
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(null)

        await expect(getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)).rejects.toThrow(
          new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {}))
        )
      })

      test('should throw error for grant with admin account', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: grantAccount,
          extra: { admin: 'true' },
          grant: { workspace: grantWorkspace.uuid, role: grantRole }
        })

        await expect(getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)).rejects.toThrow(
          new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {}))
        )
      })

      test('should throw error for grant in workspace-specific token', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: grantAccount,
          workspace: 'some-workspace-uuid',
          grant: { workspace: grantWorkspace.uuid, role: grantRole }
        })

        await expect(getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)).rejects.toThrow(
          new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {}))
        )
      })
    })

    test('should handle token with nbf and exp claims', async () => {
      const notBefore = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const expiration = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        account: mockAccount.uuid,
        workspace: mockWorkspace.uuid,
        extra: {},
        nbf: notBefore,
        exp: expiration
      })
      ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
        uuid: mockAccount.uuid,
        firstName: 'John',
        lastName: 'Doe'
      })
      ;(mockDb.socialId.find as jest.Mock).mockResolvedValue([{ _id: 'social-id-1' }])
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.User)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)

      const result = await getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)

      expect(result).toEqual({
        account: mockAccount.uuid,
        name: 'John Doe',
        socialId: 'social-id-1',
        token: expect.stringContaining(`"nbf":${notBefore},"exp":${expiration}`),
        workspace: mockWorkspace.uuid,
        workspaceUrl: mockWorkspace.url,
        endpoint: expect.any(String),
        role: AccountRole.User
      })
    })

    test('should throw error when token is not yet active', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour in the future

      ;(decodeToken as jest.Mock).mockReturnValue({ nbf: futureTime })
      ;(decodeTokenVerbose as jest.Mock).mockImplementation(() => {
        throw new Error('Token not yet active')
      })

      await expect(getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)).rejects.toThrow(
        new PlatformError(new Status(Severity.ERROR, platform.status.TokenNotActive, { notBefore: futureTime }))
      )
    })

    test('should throw error when token has expired', async () => {
      ;(decodeTokenVerbose as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired')
      })

      await expect(getLoginInfoByToken(mockCtx, mockDb, mockBranding, mockToken)).rejects.toThrow(
        new PlatformError(new Status(Severity.ERROR, platform.status.TokenExpired, {}))
      )
    })
  })

  describe('releaseSocialId', () => {
    const mockCtx = {
      error: jest.fn()
    } as unknown as MeasureContext

    const mockDb = {} as unknown as AccountDB
    const mockBranding = null
    const mockToken = 'test-token'

    const mockReleasedSocialId = {
      _id: 'released-id' as PersonId,
      type: SocialIdType.GITHUB,
      value: 'test-value#released-id',
      personUuid: 'test-person' as PersonUuid,
      isDeleted: true,
      key: 'github:test-value#released-id'
    }

    // Create spy on doReleaseSocialId
    const doReleaseSocialIdSpy = jest
      .spyOn(utils, 'doReleaseSocialId')
      .mockImplementation(async () => mockReleasedSocialId)

    beforeEach(() => {
      jest.clearAllMocks()
    })

    afterAll(() => {
      doReleaseSocialIdSpy.mockRestore()
    })

    test('should allow github service to release social id', async () => {
      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        extra: { service: 'github' }
      })

      const params = {
        personUuid: 'test-person' as PersonUuid,
        type: SocialIdType.GITHUB,
        value: 'test-value'
      }

      const result = await releaseSocialId(mockCtx, mockDb, mockBranding, mockToken, params)

      expect(doReleaseSocialIdSpy).toHaveBeenCalledWith(
        mockDb,
        params.personUuid,
        params.type,
        params.value,
        'github',
        undefined
      )
      expect(result).toBe(mockReleasedSocialId)
    })

    test('should throw error for unauthorized service', async () => {
      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        extra: { service: 'unauthorized' }
      })

      const params = {
        personUuid: 'test-person' as PersonUuid,
        type: SocialIdType.GITHUB,
        value: 'test-value'
      }

      await expect(releaseSocialId(mockCtx, mockDb, mockBranding, mockToken, params)).rejects.toThrow(
        new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {}))
      )

      expect(doReleaseSocialIdSpy).not.toHaveBeenCalled()
    })

    test('should throw error for invalid parameters', async () => {
      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        extra: { service: 'github' }
      })

      const invalidParams = [
        { type: SocialIdType.GITHUB, value: 'test' }, // missing personUuid
        { personUuid: 'test' as PersonUuid, value: 'test' }, // missing type
        { personUuid: 'test' as PersonUuid, type: SocialIdType.GITHUB }, // missing value
        { personUuid: 'test' as PersonUuid, type: 'invalid' as SocialIdType, value: 'test' } // invalid type
      ]

      for (const params of invalidParams) {
        await expect(releaseSocialId(mockCtx, mockDb, mockBranding, mockToken, params as any)).rejects.toThrow(
          new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {}))
        )
      }

      expect(doReleaseSocialIdSpy).not.toHaveBeenCalled()
    })
  })

  describe('createAccessLink', () => {
    const frontUrl = 'https://app.example.com'

    beforeEach(() => {
      ;(getMetadata as jest.Mock).mockImplementation((key) => {
        if (key === accountPlugin.metadata.FrontURL) return frontUrl
        return undefined
      })
      // Reset the mock for each test
      ;(mockDb.generatePersonUuid as jest.Mock).mockResolvedValue('generated-person-uuid' as PersonUuid)
    })

    test('should create basic access link', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)

      const result = await createAccessLink(mockCtx, mockDb, mockBranding, mockToken, {
        role: AccountRole.User
      })

      expect(mockDb.generatePersonUuid).toHaveBeenCalled()
      expect(result).toBe(
        `${frontUrl}/entrar?mode=auth&token=mocked-token-b6996120-416f-49cd-841e-e4a5d2e49c9b-${JSON.stringify({
          grant: {
            workspace: 'workspace-uuid',
            role: 'USER',
            grantedBy: 'account-uuid'
          },
          sub: 'generated-person-uuid'
        })}`
      )
    })

    test('should create link with person info', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)

      const result = await createAccessLink(mockCtx, mockDb, mockBranding, mockToken, {
        role: AccountRole.User,
        firstName: 'John',
        lastName: 'Doe'
      })

      expect(mockDb.generatePersonUuid).toHaveBeenCalled()
      expect(result).toBe(
        `${frontUrl}/entrar?mode=auth&token=mocked-token-b6996120-416f-49cd-841e-e4a5d2e49c9b-${JSON.stringify({
          grant: {
            workspace: mockWorkspace.uuid,
            role: AccountRole.User,
            grantedBy: 'account-uuid',
            firstName: 'John',
            lastName: 'Doe'
          },
          sub: 'generated-person-uuid'
        })}`
      )
    })

    test('should create link with extra parameters', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)

      const extraParams = JSON.stringify({ param1: 'value1', param2: 'value2' })
      const result = await createAccessLink(mockCtx, mockDb, mockBranding, mockToken, {
        role: AccountRole.User,
        extra: extraParams
      })

      expect(mockDb.generatePersonUuid).toHaveBeenCalled()
      expect(result).toBe(
        `${frontUrl}/entrar?mode=auth&token=mocked-token-b6996120-416f-49cd-841e-e4a5d2e49c9b-${JSON.stringify({
          grant: {
            workspace: mockWorkspace.uuid,
            role: AccountRole.User,
            grantedBy: 'account-uuid',
            extra: { param1: 'value1', param2: 'value2' }
          },
          sub: 'generated-person-uuid'
        })}`
      )
    })

    test('should create link with navigation URL', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)

      const navigateUrl = '/workspace/calendar'
      const result = await createAccessLink(mockCtx, mockDb, mockBranding, mockToken, {
        role: AccountRole.User,
        navigateUrl
      })

      expect(mockDb.generatePersonUuid).toHaveBeenCalled()
      expect(result).toBe(
        `${frontUrl}/entrar?mode=auth&token=mocked-token-b6996120-416f-49cd-841e-e4a5d2e49c9b-${JSON.stringify({
          grant: {
            workspace: 'workspace-uuid',
            role: 'USER',
            grantedBy: 'account-uuid'
          },
          sub: 'generated-person-uuid'
        })}&navigateUrl=${encodeURIComponent(navigateUrl)}`
      )
    })

    test('should throw error for insufficient role', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.DocGuest)

      await expect(
        createAccessLink(mockCtx, mockDb, mockBranding, mockToken, {
          role: AccountRole.User
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))

      expect(mockDb.generatePersonUuid).not.toHaveBeenCalled()
    })

    test('should throw error for invalid extra parameter', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)

      await expect(
        createAccessLink(mockCtx, mockDb, mockBranding, mockToken, {
          role: AccountRole.User,
          extra: 'invalid-json'
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {})))

      expect(mockDb.generatePersonUuid).not.toHaveBeenCalled()
    })

    test('should create non-personalized access link without UUID with notBefore and expiration', async () => {
      const notBefore = 1703894400 // December 30, 2023 00:00:00 UTC in seconds
      const expiration = 1704067200 // January 1, 2024 00:00:00 UTC in seconds
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)

      const result = await createAccessLink(mockCtx, mockDb, mockBranding, mockToken, {
        role: AccountRole.User,
        personalized: false,
        notBefore,
        expiration
      })

      expect(result).toBe(
        `${frontUrl}/entrar?mode=auth&token=mocked-token-b6996120-416f-49cd-841e-e4a5d2e49c9b-${JSON.stringify({
          grant: {
            workspace: mockWorkspace.uuid,
            role: AccountRole.User,
            grantedBy: 'account-uuid'
          },
          exp: expiration,
          nbf: notBefore
        })}`
      )
      expect(mockDb.generatePersonUuid).not.toHaveBeenCalled()
    })

    test('should throw error when notBefore is in milliseconds', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)

      await expect(
        createAccessLink(mockCtx, mockDb, mockBranding, mockToken, {
          role: AccountRole.User,
          notBefore: Date.now() // Milliseconds instead of seconds
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {})))

      expect(mockCtx.error).toHaveBeenCalledWith(
        'Not before appears to be in milliseconds instead of seconds',
        expect.any(Object)
      )
    })

    test('should throw error when expiration is in milliseconds', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)

      await expect(
        createAccessLink(mockCtx, mockDb, mockBranding, mockToken, {
          role: AccountRole.User,
          expiration: Date.now() // Milliseconds instead of seconds
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {})))

      expect(mockCtx.error).toHaveBeenCalledWith(
        'Expiration appears to be in milliseconds instead of seconds',
        expect.any(Object)
      )
    })

    test('should throw error when expiration is before notBefore', async () => {
      ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
      ;(mockDb.workspace.findOne as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Maintainer)

      await expect(
        createAccessLink(mockCtx, mockDb, mockBranding, mockToken, {
          role: AccountRole.User,
          notBefore: 1000,
          expiration: 900
        })
      ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {})))

      expect(mockCtx.error).toHaveBeenCalledWith('Expiration time must be after Not Before time', expect.any(Object))
    })
  })

  describe('authentication operations', () => {
    const mockCtx = {
      error: jest.fn(),
      info: jest.fn()
    } as unknown as MeasureContext

    const mockBranding = null
    const mockToken = 'test-token'

    const mockDb = {
      account: {
        findOne: jest.fn(),
        update: jest.fn()
      },
      person: {
        findOne: jest.fn()
      },
      socialId: {
        findOne: jest.fn(),
        find: jest.fn()
      }
    } as unknown as AccountDB

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('login', () => {
      const mockEmail = 'test@example.com'
      const mockPassword = 'test-password'
      const mockAccountId = 'account-uuid' as AccountUuid
      const mockPersonId = 'person-uuid' as PersonUuid

      test('should successfully login with correct credentials', async () => {
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`,
          verifiedOn: Date.now()
        }
        const mockAccount = {
          uuid: mockAccountId,
          hash: 'hashed-password',
          salt: 'salt'
        }
        const mockPerson = {
          uuid: mockPersonId,
          firstName: 'John',
          lastName: 'Doe'
        }

        jest.spyOn(utils, 'verifyPassword').mockReturnValue(true)
        jest.spyOn(utils, 'cleanEmail').mockReturnValue(mockEmail)
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)

        const result = await login(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          password: mockPassword
        })

        expect(result).toEqual({
          account: mockAccountId,
          token: expect.any(String),
          name: 'John Doe',
          socialId: 'social-id',
          tfaRequired: false
        })
      })

      test('should not return token if no social ids are confirmed', async () => {
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`,
          verifiedOn: undefined // Social ID not confirmed
        }
        const mockAccount = {
          uuid: mockAccountId,
          hash: 'hashed-password',
          salt: 'salt'
        }
        const mockPerson = {
          uuid: mockPersonId,
          firstName: 'John',
          lastName: 'Doe'
        }

        jest.spyOn(utils, 'verifyPassword').mockReturnValue(true)
        jest.spyOn(utils, 'cleanEmail').mockReturnValue(mockEmail)
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)

        const result = await login(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          password: mockPassword
        })

        expect(result).toEqual({
          account: mockAccountId,
          token: undefined,
          name: 'John Doe',
          socialId: 'social-id',
          tfaRequired: false
        })
      })

      test('should fail login with incorrect password', async () => {
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`,
          verifiedOn: Date.now()
        }
        const mockAccount = {
          uuid: mockAccountId,
          hash: 'hashed-password',
          salt: 'salt'
        }

        jest.spyOn(utils, 'verifyPassword').mockReturnValue(false)
        jest.spyOn(utils, 'cleanEmail').mockReturnValue(mockEmail)
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)

        await expect(
          login(mockCtx, mockDb, mockBranding, mockToken, {
            email: mockEmail,
            password: mockPassword
          })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.AccountNotFound, {})))
      })

      test('should fail login with non-existent email', async () => {
        jest.spyOn(utils, 'cleanEmail').mockReturnValue(mockEmail)
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(null)

        await expect(
          login(mockCtx, mockDb, mockBranding, mockToken, {
            email: mockEmail,
            password: mockPassword
          })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.AccountNotFound, {})))
      })
    })

    describe('loginOtp', () => {
      const mockEmail = 'test@example.com'
      const mockAccountId = 'account-uuid' as AccountUuid

      test('should successfully initiate OTP login for existing account', async () => {
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }
        const mockAccount = {
          uuid: mockAccountId
        }
        const mockOtpInfo = {
          email: mockEmail,
          sent: true,
          retryOn: Date.now()
        }

        jest.spyOn(utils, 'cleanEmail').mockReturnValue(mockEmail)
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        jest.spyOn(utils, 'sendOtp').mockResolvedValue(mockOtpInfo)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)

        const result = await loginOtp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail
        })

        expect(result).toEqual(mockOtpInfo)
        expect(utils.sendOtp).toHaveBeenCalledWith(mockCtx, mockDb, mockBranding, mockSocialId)
      })

      test('should fail for non-existent account', async () => {
        jest.spyOn(utils, 'cleanEmail').mockReturnValue(mockEmail)
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(null)

        await expect(
          loginOtp(mockCtx, mockDb, mockBranding, mockToken, {
            email: mockEmail
          })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.AccountNotFound, {})))
      })
    })

    describe('loginAsGuest', () => {
      test('should successfully login as readonly guest', async () => {
        const mockGuestPerson = {
          uuid: readOnlyGuestAccountUuid
        }

        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockGuestPerson)

        const result = await loginAsGuest(mockCtx, mockDb, mockBranding, mockToken)

        expect(result).toEqual({
          account: readOnlyGuestAccountUuid,
          token: expect.any(String)
        })
      })

      test('should fail if guest account not found', async () => {
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(null)

        await expect(loginAsGuest(mockCtx, mockDb, mockBranding, mockToken)).rejects.toThrow(
          new PlatformError(new Status(Severity.ERROR, platform.status.AccountNotFound, {}))
        )
      })
    })
  })

  describe('workspace membership operations', () => {
    const ownerAccount = 'owner-account-uuid' as AccountUuid
    const maintainerAccount = 'maintainer-account-uuid' as AccountUuid
    const otherOwnerAccount = 'other-owner-account-uuid' as AccountUuid

    beforeEach(() => {
      jest.clearAllMocks()
      ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
        account: maintainerAccount,
        workspace: mockWorkspace.uuid,
        extra: {}
      })
    })

    describe('leaveWorkspace', () => {
      test('should forbid maintainer from removing owner from workspace', async () => {
        ;(mockDb.getWorkspaceRole as jest.Mock).mockImplementation(async (accountId: AccountUuid) => {
          if (accountId === maintainerAccount) return AccountRole.Maintainer
          if (accountId === ownerAccount) return AccountRole.Owner
          return null
        })

        await expect(
          leaveWorkspace(mockCtx, mockDb, mockBranding, mockToken, { account: ownerAccount })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))

        expect(mockDb.unassignWorkspace).not.toHaveBeenCalled()
      })

      test('should forbid last owner from leaving workspace', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: ownerAccount,
          workspace: mockWorkspace.uuid,
          extra: {}
        })
        ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Owner)
        ;(mockDb.getWorkspaceMembers as jest.Mock).mockResolvedValue([
          { accountUuid: ownerAccount, role: AccountRole.Owner }
        ])

        await expect(
          leaveWorkspace(mockCtx, mockDb, mockBranding, mockToken, { account: ownerAccount })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))

        expect(mockDb.unassignWorkspace).not.toHaveBeenCalled()
      })

      test('should allow owner to leave when there are multiple owners', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: ownerAccount,
          workspace: mockWorkspace.uuid,
          extra: {}
        })
        ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.Owner)
        ;(mockDb.getWorkspaceMembers as jest.Mock).mockResolvedValue([
          { accountUuid: ownerAccount, role: AccountRole.Owner },
          { accountUuid: otherOwnerAccount, role: AccountRole.Owner }
        ])
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
          uuid: ownerAccount,
          firstName: 'Owner',
          lastName: 'User'
        })

        const result = await leaveWorkspace(mockCtx, mockDb, mockBranding, mockToken, { account: ownerAccount })

        expect(mockDb.unassignWorkspace).toHaveBeenCalledWith(ownerAccount, mockWorkspace.uuid)
        expect(result).toEqual({
          account: ownerAccount,
          name: 'Owner User',
          token: expect.any(String)
        })
      })
    })
  })

  describe('registration operations', () => {
    const mockCtx = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
    } as unknown as MeasureContext

    const mockBranding = null
    const mockToken = 'test-token'
    const mockEmail = 'test@example.com'
    const mockPassword = 'test-password'
    const mockFirstName = 'John'
    const mockLastName = 'Doe'
    const mockAccountId = 'account-uuid' as AccountUuid
    const mockPersonId = 'person-uuid' as PersonUuid

    const mockDb = {
      account: {
        findOne: jest.fn(),
        update: jest.fn()
      },
      person: {
        findOne: jest.fn(),
        insertOne: jest.fn(),
        update: jest.fn()
      },
      socialId: {
        findOne: jest.fn(),
        find: jest.fn(),
        insertOne: jest.fn(),
        update: jest.fn()
      },
      otp: {
        deleteMany: jest.fn()
      }
    } as unknown as AccountDB

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('signUp', () => {
      test('should create account when email service not configured', async () => {
        const mockSocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        const mockPerson = {
          uuid: mockPersonId,
          firstName: mockFirstName,
          lastName: mockLastName
        }

        jest.spyOn(utils, 'signUpByEmail').mockResolvedValue({
          account: mockAccountId,
          socialId: mockSocialId._id
        })
        jest.spyOn(utils, 'confirmEmail').mockResolvedValue(mockSocialId._id)
        jest.spyOn(utils, 'confirmHulyIds').mockResolvedValue()
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)
        ;(getMetadata as jest.Mock).mockReturnValue('') // No mail service configured

        const result = await signUp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          password: mockPassword,
          firstName: mockFirstName,
          lastName: mockLastName
        })

        expect(result).toEqual({
          account: mockAccountId,
          name: 'John Doe',
          socialId: mockSocialId._id,
          token: expect.any(String)
        })

        expect(utils.signUpByEmail).toHaveBeenCalledWith(
          mockCtx,
          mockDb,
          mockBranding,
          mockEmail,
          mockPassword,
          mockFirstName,
          mockLastName
        )
        expect(utils.confirmEmail).toHaveBeenCalledWith(mockCtx, mockDb, mockAccountId, mockEmail)
        expect(utils.confirmHulyIds).toHaveBeenCalledWith(mockCtx, mockDb, mockAccountId)
        expect(mockCtx.warn).toHaveBeenCalled()
      })

      test('should create account and send confirmation when email service configured', async () => {
        const mockSocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        const mockPerson = {
          uuid: mockPersonId,
          firstName: mockFirstName,
          lastName: mockLastName
        }

        jest.spyOn(utils, 'signUpByEmail').mockResolvedValue({
          account: mockAccountId,
          socialId: mockSocialId._id
        })
        jest.spyOn(utils, 'sendEmailConfirmation').mockResolvedValue()
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)
        ;(getMetadata as jest.Mock).mockReturnValue('http://mail-service.com')

        const result = await signUp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          password: mockPassword,
          firstName: mockFirstName,
          lastName: mockLastName
        })

        expect(result).toEqual({
          account: mockAccountId,
          name: 'John Doe',
          socialId: mockSocialId._id,
          token: undefined // No token until email confirmed
        })

        expect(utils.signUpByEmail).toHaveBeenCalledWith(
          mockCtx,
          mockDb,
          mockBranding,
          mockEmail,
          mockPassword,
          mockFirstName,
          mockLastName
        )
        expect(utils.sendEmailConfirmation).toHaveBeenCalledWith(mockCtx, mockBranding, mockAccountId, mockEmail)
        expect(mockCtx.warn).not.toHaveBeenCalled()
      })

      test('should fail with missing required fields', async () => {
        const testCases = [
          { email: '', password: mockPassword, firstName: mockFirstName },
          { email: mockEmail, password: '', firstName: mockFirstName },
          { email: mockEmail, password: mockPassword, firstName: '' }
        ]

        for (const testCase of testCases) {
          await expect(signUp(mockCtx, mockDb, mockBranding, mockToken, testCase as any)).rejects.toThrow(
            new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {}))
          )
        }
      })
    })

    describe('confirm', () => {
      test('should confirm email and return login info', async () => {
        const mockSocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        const mockPerson = {
          uuid: mockPersonId,
          firstName: mockFirstName,
          lastName: mockLastName
        }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId,
          extra: { confirmEmail: mockEmail }
        })

        jest.spyOn(utils, 'confirmEmail').mockResolvedValue(mockSocialId._id)
        jest.spyOn(utils, 'confirmHulyIds').mockResolvedValue()
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)

        const result = await confirm(mockCtx, mockDb, mockBranding, mockToken)

        expect(result).toEqual({
          account: mockAccountId,
          name: 'John Doe',
          socialId: mockSocialId._id,
          token: expect.any(String)
        })

        expect(utils.confirmEmail).toHaveBeenCalledWith(mockCtx, mockDb, mockAccountId, mockEmail)
        expect(utils.confirmHulyIds).toHaveBeenCalledWith(mockCtx, mockDb, mockAccountId)
      })

      test('should fail if confirmation email not in token', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId,
          extra: {} // No confirmEmail in extra
        })

        await expect(confirm(mockCtx, mockDb, mockBranding, mockToken)).rejects.toThrow(
          new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {}))
        )
      })

      test('should fail if person not found', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId,
          extra: { confirmEmail: mockEmail }
        })

        jest.spyOn(utils, 'confirmEmail').mockResolvedValue('social-id' as PersonId)
        jest.spyOn(utils, 'confirmHulyIds').mockResolvedValue()
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(null)

        await expect(confirm(mockCtx, mockDb, mockBranding, mockToken)).rejects.toThrow(
          new PlatformError(new Status(Severity.ERROR, platform.status.PersonNotFound, { person: mockAccountId }))
        )
      })

      test('should auto-join workspace after confirming email when invite info is present in token', async () => {
        const mockInviteId = 'invite-uuid'
        const mockWorkspaceUrl = 'test-workspace'
        const mockWorkspaceUuid = 'ws-uuid' as WorkspaceUuid
        const mockSocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }
        const mockPerson = {
          uuid: mockPersonId,
          firstName: mockFirstName,
          lastName: mockLastName
        }
        const mockInvite: any = {
          id: mockInviteId,
          workspaceUuid: mockWorkspaceUuid,
          email: mockEmail,
          remainingUses: 1,
          expiresOn: Date.now() + 100000,
          role: AccountRole.User
        }
        const mockWorkspace: any = {
          uuid: mockWorkspaceUuid,
          url: mockWorkspaceUrl,
          name: 'Test Workspace',
          region: 'us'
        }
        const joinResult = {
          account: mockAccountId,
          workspace: mockWorkspaceUuid,
          workspaceUrl: mockWorkspaceUrl,
          endpoint: 'endpoint',
          role: AccountRole.User,
          token: 'mocked-token'
        }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId,
          extra: { confirmEmail: mockEmail, inviteId: mockInviteId, workspaceUrl: mockWorkspaceUrl }
        })

        jest.spyOn(utils, 'confirmEmail').mockResolvedValue(mockSocialId._id)
        jest.spyOn(utils, 'confirmHulyIds').mockResolvedValue()
        jest.spyOn(utils, 'getWorkspaceJoinInfo').mockResolvedValue({
          email: mockEmail,
          invite: mockInvite,
          workspace: mockWorkspace
        } as any)
        jest.spyOn(utils, 'doJoinByInvite').mockResolvedValue(joinResult as any)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)

        const result = await confirm(mockCtx, mockDb, mockBranding, mockToken)

        expect(utils.confirmEmail).toHaveBeenCalledWith(mockCtx, mockDb, mockAccountId, mockEmail)
        expect(utils.getWorkspaceJoinInfo).toHaveBeenCalledWith(
          mockCtx,
          mockDb,
          mockEmail,
          mockInviteId,
          mockWorkspaceUrl
        )
        expect(utils.doJoinByInvite).toHaveBeenCalled()
        expect(result).toEqual(joinResult)
      })
    })

    describe('signUpOtp', () => {
      test('should initiate signup with OTP for new user', async () => {
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockPersonId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        // No existing social id
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(null)
        jest.spyOn(utils, 'sendOtp').mockResolvedValue({ retryOn: Date.now() + 60000, sent: true })
        ;(mockDb.person.insertOne as jest.Mock).mockResolvedValue(mockPersonId)
        ;(mockDb.socialId.insertOne as jest.Mock).mockResolvedValue(mockSocialId._id)

        const result = await signUpOtp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          firstName: mockFirstName,
          lastName: mockLastName
        })

        expect(result).toEqual({ retryOn: expect.any(Number), sent: true })
        expect(mockDb.person.insertOne).toHaveBeenCalledWith({
          firstName: mockFirstName,
          lastName: mockLastName
        })
      })

      test('should initiate signup with OTP for existing unverified email', async () => {
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockPersonId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        // Existing unverified social id
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        jest.spyOn(utils, 'sendOtp').mockResolvedValue({ retryOn: Date.now() + 60000, sent: true })
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(null)

        const result = await signUpOtp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          firstName: mockFirstName,
          lastName: mockLastName
        })

        expect(result).toEqual({ retryOn: expect.any(Number), sent: true })
        expect(mockDb.person.update).toHaveBeenCalledWith(
          { uuid: mockPersonId },
          { firstName: mockFirstName, lastName: mockLastName }
        )
      })

      test('should fail if email already exists with account', async () => {
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockPersonId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue({ uuid: mockPersonId })

        await expect(
          signUpOtp(mockCtx, mockDb, mockBranding, mockToken, {
            email: mockEmail,
            firstName: mockFirstName,
            lastName: mockLastName
          })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.AccountAlreadyExists, {})))
      })

      test('should fail with missing required fields', async () => {
        const testCases = [
          { email: '', firstName: mockFirstName },
          { email: mockEmail, firstName: '' }
        ]

        for (const testCase of testCases) {
          await expect(signUpOtp(mockCtx, mockDb, mockBranding, mockToken, testCase as any)).rejects.toThrow(
            new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {}))
          )
        }
      })
    })

    describe('validateOtp', () => {
      beforeEach(() => {
        jest.spyOn(utils, 'setPassword').mockResolvedValue()
        ;(mockDb.socialId.find as jest.Mock).mockResolvedValue([])
        jest.spyOn(utils, 'doReleaseSocialId').mockResolvedValue({} as SocialId)
      })

      test('should validate OTP and create account for signup', async () => {
        const personId = 'social-id' as PersonId
        const mockSocialId: SocialId = {
          _id: personId,
          personUuid: mockPersonId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        jest.spyOn(utils, 'isOtpValid').mockResolvedValue(true)
        jest.spyOn(utils, 'createAccount').mockResolvedValue(personId)

        const mockPerson = {
          uuid: mockPersonId,
          firstName: mockFirstName,
          lastName: mockLastName
        }
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(null)

        const result = await validateOtp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          code: '123456',
          password: mockPassword
        })

        expect(result).toEqual({
          account: mockPersonId,
          name: 'John Doe',
          socialId: mockSocialId._id,
          token: expect.any(String),
          tfaRequired: false
        })

        expect(mockDb.otp.deleteMany).toHaveBeenCalledWith({ socialId: mockSocialId._id })
        expect(mockDb.socialId.update).toHaveBeenCalledWith(
          { _id: mockSocialId._id },
          { verifiedOn: expect.any(Number) }
        )
        expect(utils.setPassword).toHaveBeenCalledWith(mockCtx, mockDb, mockBranding, mockPersonId, mockPassword)
      })

      test('should validate OTP for login', async () => {
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockPersonId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`,
          verifiedOn: Date.now()
        }

        const mockAccount = {
          uuid: mockPersonId
        }

        const mockPerson = {
          uuid: mockPersonId,
          firstName: mockFirstName,
          lastName: mockLastName
        }

        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        jest.spyOn(utils, 'isOtpValid').mockResolvedValue(true)
        jest.spyOn(utils, 'confirmHulyIds').mockResolvedValue()
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)

        const result = await validateOtp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          code: '123456'
        })

        expect(result).toEqual({
          account: mockPersonId,
          name: 'John Doe',
          socialId: mockSocialId._id,
          token: expect.any(String),
          tfaRequired: false
        })

        expect(mockDb.otp.deleteMany).toHaveBeenCalledWith({ socialId: mockSocialId._id })
        expect(utils.setPassword).not.toHaveBeenCalled()
        expect(utils.doReleaseSocialId).not.toHaveBeenCalled()
      })

      test('should replace previous emails only after verifying the new email', async () => {
        const mockSocialId: SocialId = {
          _id: 'new-email' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }
        const previousEmails = ['old@example.com', 'legacy@example.com'].map((value) => ({
          ...mockSocialId,
          _id: value as PersonId,
          value
        }))
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({ account: mockAccountId })
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        jest.spyOn(utils, 'isOtpValid').mockResolvedValue(true)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue({ uuid: mockAccountId })
        ;(mockDb.socialId.findOne as jest.Mock).mockResolvedValue({ ...mockSocialId, verifiedOn: Date.now() })
        ;(mockDb.socialId.find as jest.Mock).mockResolvedValue([...previousEmails, mockSocialId])
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
          uuid: mockAccountId,
          firstName: mockFirstName,
          lastName: mockLastName
        })

        await validateOtp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          code: '123456',
          action: 'verify'
        })

        expect(mockDb.socialId.find).toHaveBeenCalledWith({
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          isDeleted: { $ne: true }
        })
        expect(utils.doReleaseSocialId).toHaveBeenCalledTimes(2)
        for (const previousEmail of previousEmails) {
          expect(utils.doReleaseSocialId).toHaveBeenCalledWith(
            mockDb, mockAccountId, SocialIdType.EMAIL, previousEmail.value, `replaceEmail@${mockAccountId}`, true
          )
        }
        expect((mockDb.socialId.update as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
          (utils.doReleaseSocialId as jest.Mock).mock.invocationCallOrder[0]
        )
      })

      test('should validate OTP for unverified social id belonging to caller', async () => {
        const callerAccountId = 'caller-account' as AccountUuid
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: callerAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: callerAccountId
        })

        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        jest.spyOn(utils, 'isOtpValid').mockResolvedValue(true)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue({ uuid: callerAccountId })
        ;(mockDb.socialId.findOne as jest.Mock).mockResolvedValue(mockSocialId)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
          uuid: mockPersonId,
          firstName: mockFirstName,
          lastName: mockLastName
        })

        const result = await validateOtp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          code: '123456',
          action: 'verify'
        })

        expect(result).toEqual({
          account: callerAccountId,
          name: 'John Doe',
          socialId: mockSocialId._id,
          token: undefined,
          tfaRequired: false
        })

        expect(mockDb.otp.deleteMany).toHaveBeenCalledWith({ socialId: mockSocialId._id })
        expect(mockDb.socialId.update).toHaveBeenCalledWith(
          { _id: mockSocialId._id },
          { verifiedOn: expect.any(Number) }
        )
        expect(utils.setPassword).not.toHaveBeenCalled()
      })

      test('should merge person to caller when verifying social id without account', async () => {
        const callerAccountId = 'caller-account' as AccountUuid
        const targetPersonId = 'target-person' as PersonUuid
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: targetPersonId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: callerAccountId
        })

        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        jest.spyOn(utils, 'isOtpValid').mockResolvedValue(true)
        jest.spyOn(utils, 'doMergePersons').mockResolvedValue()
        ;(mockDb.account.findOne as jest.Mock).mockImplementation(async ({ uuid }) => {
          if (uuid === callerAccountId) {
            return { uuid: callerAccountId }
          }
          if (uuid === targetPersonId) {
            return null // The target person has no account
          }
          return null
        })
        ;(mockDb.socialId.findOne as jest.Mock).mockResolvedValue({ ...mockSocialId, personUuid: callerAccountId })
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
          uuid: callerAccountId,
          firstName: mockFirstName,
          lastName: mockLastName
        })

        const result = await validateOtp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          code: '123456',
          action: 'verify'
        })

        expect(result).toEqual({
          account: callerAccountId,
          name: 'John Doe',
          socialId: mockSocialId._id,
          token: undefined,
          tfaRequired: false
        })

        expect(mockDb.otp.deleteMany).toHaveBeenCalledWith({ socialId: mockSocialId._id })
        expect(utils.doMergePersons).toHaveBeenCalledWith(mockDb, callerAccountId, targetPersonId)
        expect(mockDb.socialId.update).toHaveBeenCalledWith(
          { _id: mockSocialId._id },
          { verifiedOn: expect.any(Number) }
        )
      })

      test('should move unverified social id to caller account', async () => {
        const callerAccountId = 'caller-account' as AccountUuid
        const targetAccountId = 'target-account' as AccountUuid
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: targetAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: callerAccountId
        })

        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        jest.spyOn(utils, 'isOtpValid').mockResolvedValue(true)
        ;(mockDb.account.findOne as jest.Mock).mockImplementation(async ({ uuid }) =>
          uuid === targetAccountId ? { uuid: targetAccountId } : { uuid: callerAccountId }
        )
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue({
          uuid: callerAccountId,
          firstName: mockFirstName,
          lastName: mockLastName
        })

        const result = await validateOtp(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail,
          code: '123456',
          action: 'verify'
        })

        expect(result).toEqual({
          account: callerAccountId,
          name: 'John Doe',
          socialId: mockSocialId._id,
          token: undefined,
          tfaRequired: false
        })

        expect(mockDb.otp.deleteMany).toHaveBeenCalledWith({ socialId: mockSocialId._id })
        expect(mockDb.socialId.update).toHaveBeenCalledWith(
          { _id: mockSocialId._id },
          { personUuid: callerAccountId, verifiedOn: expect.any(Number) }
        )
      })

      test('should fail if OTP is invalid', async () => {
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockPersonId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        jest.spyOn(utils, 'isOtpValid').mockResolvedValue(false)

        await expect(
          validateOtp(mockCtx, mockDb, mockBranding, mockToken, {
            email: mockEmail,
            code: '123456',
            action: 'verify'
          })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.InvalidOtp, {})))
        expect(mockDb.socialId.update).not.toHaveBeenCalled()
        expect(utils.doReleaseSocialId).not.toHaveBeenCalled()
      })

      test('should fail if email not found', async () => {
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(null)

        await expect(
          validateOtp(mockCtx, mockDb, mockBranding, mockToken, {
            email: mockEmail,
            code: '123456'
          })
        ).rejects.toThrow(
          new PlatformError(new Status(Severity.ERROR, platform.status.AccountNotFound, { account: mockEmail }))
        )
      })

      test('should fail if verifying for existing verified social id', async () => {
        const mockSocialId: SocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockPersonId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`,
          verifiedOn: Date.now()
        }

        const callerAccountId = 'caller-account' as AccountUuid
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: callerAccountId
        })

        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        jest.spyOn(utils, 'isOtpValid').mockResolvedValue(true)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue({ uuid: mockPersonId })

        await expect(
          validateOtp(mockCtx, mockDb, mockBranding, mockToken, {
            email: mockEmail,
            code: '123456',
            action: 'verify'
          })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.AccountAlreadyExists, {})))
        expect(utils.doReleaseSocialId).not.toHaveBeenCalled()
      })
    })

    describe('signUpJoin', () => {
      const mockInviteId = 'invite-uuid'
      const mockWorkspaceUrl = 'test-workspace'
      const mockWorkspaceUuid = 'ws-uuid' as WorkspaceUuid
      const mockInvite: any = {
        id: mockInviteId,
        workspaceUuid: mockWorkspaceUuid,
        email: mockEmail,
        remainingUses: 1,
        expiresOn: Date.now() + 100000,
        role: AccountRole.User
      }
      const mockWorkspace: any = {
        uuid: mockWorkspaceUuid,
        url: mockWorkspaceUrl,
        name: 'Test Workspace',
        region: 'us'
      }
      const baseParams = {
        email: mockEmail,
        password: mockPassword,
        first: mockFirstName,
        last: mockLastName,
        inviteId: mockInviteId,
        workspaceUrl: mockWorkspaceUrl
      }

      test('should require confirmation for generic invites when MAIL_URL is configured', async () => {
        const mockSocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }
        const mockPerson = {
          uuid: mockPersonId,
          firstName: mockFirstName,
          lastName: mockLastName
        }

        jest.spyOn(utils, 'getWorkspaceJoinInfo').mockResolvedValue({
          email: mockEmail,
          invite: { ...mockInvite, email: undefined },
          workspace: mockWorkspace
        } as any)
        jest.spyOn(utils, 'signUpByEmail').mockResolvedValue({
          account: mockAccountId,
          socialId: mockSocialId._id
        })
        jest.spyOn(utils, 'sendEmailConfirmation').mockResolvedValue()
        jest.spyOn(utils, 'doJoinByInvite').mockResolvedValue({} as any)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)
        ;(getMetadata as jest.Mock).mockReturnValue('http://mail-service.com')

        const result = await signUpJoin(mockCtx, mockDb, mockBranding, mockToken, baseParams)

        // signUpByEmail must NOT mark the new account/social-id as confirmed
        expect(utils.signUpByEmail).toHaveBeenCalledWith(
          mockCtx,
          mockDb,
          mockBranding,
          mockEmail,
          mockPassword,
          mockFirstName,
          mockLastName,
          false
        )
        // Confirmation email must be sent, threading the invite info through the token
        expect(utils.sendEmailConfirmation).toHaveBeenCalledWith(
          mockCtx,
          mockBranding,
          mockAccountId,
          mockEmail,
          expect.objectContaining({ inviteId: mockInviteId, workspaceUrl: mockWorkspaceUrl })
        )
        // Workspace join must be deferred until after email confirmation
        expect(utils.doJoinByInvite).not.toHaveBeenCalled()
        expect(result).toEqual({
          account: mockAccountId,
          name: 'John Doe',
          socialId: mockSocialId._id,
          token: undefined
        })
      })

      test.each(['', 'http://mail-service.com'])('should auto-confirm recipient-bound invite with MAIL_URL=%s', async (mailUrl) => {
        const mockSocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }
        const joinResult = {
          account: mockAccountId,
          workspace: mockWorkspaceUuid,
          workspaceUrl: mockWorkspaceUrl,
          endpoint: 'endpoint',
          role: AccountRole.User,
          token: 'mocked-token'
        }

        jest.spyOn(utils, 'getWorkspaceJoinInfo').mockResolvedValue({
          email: mockEmail,
          invite: mockInvite,
          workspace: mockWorkspace
        } as any)
        jest.spyOn(utils, 'signUpByEmail').mockResolvedValue({
          account: mockAccountId,
          socialId: mockSocialId._id
        })
        jest.spyOn(utils, 'confirmHulyIds').mockResolvedValue()
        jest.spyOn(utils, 'sendEmailConfirmation').mockResolvedValue()
        jest.spyOn(utils, 'doJoinByInvite').mockResolvedValue(joinResult as any)
        ;(getMetadata as jest.Mock).mockReturnValue(mailUrl)

        const result = await signUpJoin(mockCtx, mockDb, mockBranding, mockToken, baseParams)

        expect(utils.sendEmailConfirmation).not.toHaveBeenCalled()
        expect(utils.doJoinByInvite).toHaveBeenCalled()
        expect(result).toEqual(joinResult)
      })

      test('should fail with missing required fields', async () => {
        const testCases = [
          { ...baseParams, password: '' },
          { ...baseParams, first: '' }
        ]
        for (const testCase of testCases) {
          await expect(signUpJoin(mockCtx, mockDb, mockBranding, mockToken, testCase as any)).rejects.toThrow(
            new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {}))
          )
        }
      })
    })
  })

  describe('password operations', () => {
    const mockCtx = {
      error: jest.fn(),
      info: jest.fn()
    } as unknown as MeasureContext

    const mockBranding = null
    const mockToken = 'test-token'
    const mockAccountId = 'account-uuid' as AccountUuid
    const mockEmail = 'test@example.com'
    const mockOldPassword = 'old-password'
    const mockNewPassword = 'new-password'

    const mockDb = {
      account: {
        findOne: jest.fn(),
        update: jest.fn()
      },
      person: {
        findOne: jest.fn()
      },
      socialId: {
        findOne: jest.fn(),
        update: jest.fn()
      }
    } as unknown as AccountDB

    beforeEach(() => {
      jest.clearAllMocks()
      global.fetch = jest.fn().mockResolvedValue({ ok: true })
    })

    describe('changePassword', () => {
      test('should change password when old password is correct', async () => {
        const mockAccount = {
          uuid: mockAccountId,
          hash: 'old-hash',
          salt: 'old-salt'
        }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId
        })
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
        jest.spyOn(utils, 'verifyPassword').mockReturnValue(true)
        jest.spyOn(utils, 'setPassword').mockResolvedValue()

        await changePassword(mockCtx, mockDb, mockBranding, mockToken, {
          oldPassword: mockOldPassword,
          newPassword: mockNewPassword
        })

        expect(utils.verifyPassword).toHaveBeenCalledWith(mockOldPassword, mockAccount.hash, mockAccount.salt)
        expect(utils.setPassword).toHaveBeenCalledWith(mockCtx, mockDb, mockBranding, mockAccountId, mockNewPassword)
      })

      test('should fail if old password is incorrect', async () => {
        const mockAccount = {
          uuid: mockAccountId,
          hash: 'old-hash',
          salt: 'old-salt'
        }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId
        })
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
        jest.spyOn(utils, 'verifyPassword').mockReturnValue(false)

        await expect(
          changePassword(mockCtx, mockDb, mockBranding, mockToken, {
            oldPassword: mockOldPassword,
            newPassword: mockNewPassword
          })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))

        expect(utils.setPassword).not.toHaveBeenCalled()
      })

      test('should fail if account not found', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId
        })
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(null)

        await expect(
          changePassword(mockCtx, mockDb, mockBranding, mockToken, {
            oldPassword: mockOldPassword,
            newPassword: mockNewPassword
          })
        ).rejects.toThrow(
          new PlatformError(new Status(Severity.ERROR, platform.status.AccountNotFound, { account: mockAccountId }))
        )
      })
    })

    describe('requestPasswordReset', () => {
      const mailUrl = 'https://mail.example.com'
      const mailAuth = 'mail-auth-token'
      const frontUrl = 'https://front.example.com'

      beforeEach(() => {
        ;(getMetadata as jest.Mock).mockImplementation((key) => {
          switch (key) {
            case accountPlugin.metadata.MAIL_URL:
              return mailUrl
            case accountPlugin.metadata.MAIL_AUTH_TOKEN:
              return mailAuth
            case accountPlugin.metadata.FrontURL:
              return frontUrl
            default:
              return undefined
          }
        })
      })

      test('should send reset password email', async () => {
        const mockSocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        const mockAccount = {
          uuid: mockAccountId
        }

        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)

        await requestPasswordReset(mockCtx, mockDb, mockBranding, mockToken, {
          email: mockEmail
        })

        expect(global.fetch).toHaveBeenCalledWith(`${mailUrl}/send`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mailAuth}`
          },
          body: expect.stringContaining(mockEmail)
        })
      })

      test('should fail if email not found', async () => {
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(null)

        await expect(
          requestPasswordReset(mockCtx, mockDb, mockBranding, mockToken, {
            email: mockEmail
          })
        ).rejects.toThrow(
          new PlatformError(
            new Status(Severity.ERROR, platform.status.SocialIdNotFound, {
              value: mockEmail,
              type: SocialIdType.EMAIL
            })
          )
        )

        expect(global.fetch).not.toHaveBeenCalled()
      })

      test('should fail if account not found', async () => {
        const mockSocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`
        }

        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(mockSocialId)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(null)

        await expect(
          requestPasswordReset(mockCtx, mockDb, mockBranding, mockToken, {
            email: mockEmail
          })
        ).rejects.toThrow(
          new PlatformError(
            new Status(Severity.ERROR, platform.status.AccountNotFound, {
              account: mockAccountId
            })
          )
        )

        expect(global.fetch).not.toHaveBeenCalled()
      })
    })

    describe('restorePassword', () => {
      test('should restore password and return login info', async () => {
        const mockSocialId = {
          _id: 'social-id' as PersonId,
          personUuid: mockAccountId,
          type: SocialIdType.EMAIL,
          value: mockEmail,
          key: `email:${mockEmail}`,
          verifiedOn: undefined
        }
        const mockPerson = {
          uuid: mockAccountId,
          firstName: 'John',
          lastName: 'Doe'
        }
        const mockAccount = { uuid: mockAccountId }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId,
          extra: { restoreEmail: mockEmail }
        })
        jest
          .spyOn(utils, 'getEmailSocialId')
          .mockImplementationOnce(async () => mockSocialId)
          .mockImplementationOnce(async () => ({ ...mockSocialId, verifiedOn: Date.now() }))
        jest.spyOn(utils, 'setPassword').mockResolvedValue()
        jest.spyOn(utils, 'verifyPassword').mockReturnValue(true)
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)
        ;(mockDb.account.findOne as jest.Mock).mockResolvedValue(mockAccount)
        const result = await restorePassword(mockCtx, mockDb, mockBranding, mockToken, {
          password: mockNewPassword
        })

        expect(result).toEqual({
          account: mockAccountId,
          name: 'John Doe',
          token: expect.any(String),
          socialId: mockSocialId._id,
          tfaRequired: false
        })

        expect(utils.setPassword).toHaveBeenCalledWith(mockCtx, mockDb, mockBranding, mockAccountId, mockNewPassword)
        expect(mockDb.socialId.update).toHaveBeenCalledWith(
          { key: mockSocialId.key },
          { verifiedOn: expect.any(Number) }
        )
      })

      test('should fail if restore email not in token', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId,
          extra: {} // No restoreEmail
        })

        await expect(
          restorePassword(mockCtx, mockDb, mockBranding, mockToken, {
            password: mockNewPassword
          })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))
      })

      test('should fail if email not found', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId,
          extra: { restoreEmail: mockEmail }
        })
        jest.spyOn(utils, 'getEmailSocialId').mockResolvedValue(null)

        await expect(
          restorePassword(mockCtx, mockDb, mockBranding, mockToken, {
            password: mockNewPassword
          })
        ).rejects.toThrow(
          new PlatformError(
            new Status(Severity.ERROR, platform.status.SocialIdNotFound, {
              value: mockEmail,
              type: SocialIdType.EMAIL
            })
          )
        )
      })
    })
  })

  describe('info operations', () => {
    const mockCtx = {
      error: jest.fn(),
      info: jest.fn()
    } as unknown as MeasureContext

    const mockBranding = null
    const mockToken = 'test-token'
    const mockAccountId = 'account-uuid' as AccountUuid

    const mockDb = {
      person: {
        findOne: jest.fn()
      },
      socialId: {
        find: jest.fn()
      }
    } as unknown as AccountDB

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('getSocialIds', () => {
      test('should return confirmed social ids', async () => {
        const mockSocialIds: SocialId[] = [
          {
            _id: 'social-id-1' as PersonId,
            personUuid: mockAccountId,
            type: SocialIdType.EMAIL,
            value: 'test@example.com',
            key: 'email:test@example.com',
            verifiedOn: Date.now()
          },
          {
            _id: 'social-id-2' as PersonId,
            personUuid: mockAccountId,
            type: SocialIdType.GITHUB,
            value: 'testuser',
            key: 'github:testuser',
            verifiedOn: Date.now()
          }
        ]

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId
        })
        ;(mockDb.socialId.find as jest.Mock).mockResolvedValue(mockSocialIds)

        const result = await getSocialIds(mockCtx, mockDb, mockBranding, mockToken, {
          confirmed: true,
          includeDeleted: false
        })

        expect(result).toEqual(mockSocialIds)
        expect(mockDb.socialId.find).toHaveBeenCalledWith({
          personUuid: mockAccountId,
          verifiedOn: { $gt: 0 }
        })
      })

      test('should exclude deleted social ids when requested', async () => {
        const mockSocialIds: SocialId[] = [
          {
            _id: 'social-id-1' as PersonId,
            personUuid: mockAccountId,
            type: SocialIdType.EMAIL,
            value: 'test@example.com',
            key: 'email:test@example.com',
            verifiedOn: Date.now()
          },
          {
            _id: 'social-id-2' as PersonId,
            personUuid: mockAccountId,
            type: SocialIdType.GITHUB,
            value: 'testuser',
            key: 'github:testuser',
            verifiedOn: Date.now(),
            isDeleted: true
          }
        ]

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId
        })
        ;(mockDb.socialId.find as jest.Mock).mockResolvedValue(mockSocialIds)

        const result = await getSocialIds(mockCtx, mockDb, mockBranding, mockToken, {
          confirmed: true,
          includeDeleted: false
        })

        expect(result).toEqual([mockSocialIds[0]])
      })

      test('should fail when requesting unconfirmed social ids', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId
        })

        await expect(
          getSocialIds(mockCtx, mockDb, mockBranding, mockToken, {
            confirmed: false,
            includeDeleted: false
          })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))

        expect(mockDb.socialId.find).not.toHaveBeenCalled()
      })
    })

    describe('getPerson', () => {
      test('should return person info', async () => {
        const mockPerson = {
          uuid: mockAccountId,
          firstName: 'John',
          lastName: 'Doe'
        }

        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId
        })
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(mockPerson)

        const result = await getPerson(mockCtx, mockDb, mockBranding, mockToken)

        expect(result).toEqual(mockPerson)
        expect(mockDb.person.findOne).toHaveBeenCalledWith({ uuid: mockAccountId })
      })

      test('should fail if person not found', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: mockAccountId
        })
        ;(mockDb.person.findOne as jest.Mock).mockResolvedValue(null)

        await expect(getPerson(mockCtx, mockDb, mockBranding, mockToken)).rejects.toThrow(
          new PlatformError(new Status(Severity.ERROR, platform.status.PersonNotFound, { person: mockAccountId }))
        )
      })
    })

    describe('getAccountInfo', () => {
      const callerAccount = 'caller-account-uuid' as AccountUuid
      const otherAccount = 'other-account-uuid' as AccountUuid

      const accountInfoDb = {
        account: {
          findOne: jest.fn()
        }
      } as unknown as AccountDB

      beforeEach(() => {
        jest.clearAllMocks()
      })

      test('returns own info when accountId matches caller', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({ account: callerAccount, extra: {} })
        ;(accountInfoDb.account.findOne as jest.Mock).mockResolvedValue({
          uuid: callerAccount,
          timezone: 'America/New_York',
          locale: 'en-US',
          tfaSecret: 'secret'
        })

        const result = await getAccountInfo(mockCtx, accountInfoDb, mockBranding, mockToken, {
          accountId: callerAccount
        })

        expect(result).toEqual({ timezone: 'America/New_York', locale: 'en-US', tfaEnabled: true })
        expect(accountInfoDb.account.findOne).toHaveBeenCalledWith({ uuid: callerAccount })
      })

      test('rejects cross-account lookup for non-admin, non-service caller', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({ account: callerAccount, extra: {} })

        await expect(
          getAccountInfo(mockCtx, accountInfoDb, mockBranding, mockToken, { accountId: otherAccount })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {})))

        expect(accountInfoDb.account.findOne).not.toHaveBeenCalled()
      })

      test('allows admin to read other account info', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({ account: callerAccount, extra: { admin: 'true' } })
        ;(accountInfoDb.account.findOne as jest.Mock).mockResolvedValue({
          uuid: otherAccount,
          timezone: 'Europe/London',
          locale: 'en-GB',
          tfaSecret: null
        })

        const result = await getAccountInfo(mockCtx, accountInfoDb, mockBranding, mockToken, {
          accountId: otherAccount
        })

        expect(result).toEqual({ timezone: 'Europe/London', locale: 'en-GB', tfaEnabled: false })
        expect(accountInfoDb.account.findOne).toHaveBeenCalledWith({ uuid: otherAccount })
      })

      test('allows workspace service token to read other account info', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
          account: callerAccount,
          extra: { service: 'workspace' }
        })
        ;(accountInfoDb.account.findOne as jest.Mock).mockResolvedValue({
          uuid: otherAccount,
          timezone: 'Asia/Tokyo',
          locale: 'ja-JP',
          tfaSecret: null
        })

        const result = await getAccountInfo(mockCtx, accountInfoDb, mockBranding, mockToken, {
          accountId: otherAccount
        })

        expect(result).toEqual({ timezone: 'Asia/Tokyo', locale: 'ja-JP', tfaEnabled: false })
      })

      test('throws BadRequest when accountId is missing', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({ account: callerAccount, extra: {} })

        await expect(
          getAccountInfo(mockCtx, accountInfoDb, mockBranding, mockToken, { accountId: '' as AccountUuid })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.BadRequest, {})))

        expect(accountInfoDb.account.findOne).not.toHaveBeenCalled()
      })

      test('throws AccountNotFound when account does not exist', async () => {
        ;(decodeTokenVerbose as jest.Mock).mockReturnValue({ account: callerAccount, extra: {} })
        ;(accountInfoDb.account.findOne as jest.Mock).mockResolvedValue(null)

        await expect(
          getAccountInfo(mockCtx, accountInfoDb, mockBranding, mockToken, { accountId: callerAccount })
        ).rejects.toThrow(new PlatformError(new Status(Severity.ERROR, platform.status.AccountNotFound, {})))
      })
    })
  })

  describe('checkJoin', () => {
    const mockInvite = {
      id: 'invite-uuid',
      workspaceUuid: 'workspace-uuid' as WorkspaceUuid,
      role: AccountRole.User,
      expiresOn: 0,
      remainingUses: -1
    }

    test('should return workspace login info if user is already a member', async () => {
      const mockEmail = 'user@example.com'
      ;(mockDb.socialId.findOne as jest.Mock).mockResolvedValue({ value: mockEmail })

      jest.spyOn(utils, 'getWorkspaceInvite').mockResolvedValue(mockInvite as any)
      jest.spyOn(utils, 'checkInvite').mockResolvedValue(mockInvite.workspaceUuid)
      jest.spyOn(utils, 'getWorkspaceById').mockResolvedValue(mockWorkspace as any)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(AccountRole.User)

      const mockLoginInfo = {
        account: mockAccount.uuid,
        role: AccountRole.User,
        token: 'workspace-token'
      }
      jest.spyOn(utils, 'selectWorkspace').mockResolvedValue(mockLoginInfo as any)

      const result = await checkJoin(mockCtx, mockDb, mockBranding, mockToken, { inviteId: 'invite-uuid' })

      expect(result).toEqual({
        account: mockAccount.uuid,
        role: AccountRole.User,
        token: 'workspace-token'
      })
      expect(mockDb.getWorkspaceRole).toHaveBeenCalledWith(mockAccount.uuid, mockWorkspace.uuid)
      expect(mockDb.updateWorkspaceRole).not.toHaveBeenCalled()
    })

    test('should throw Forbidden error if user is not a member', async () => {
      const mockEmail = 'user@example.com'
      ;(mockDb.socialId.findOne as jest.Mock).mockResolvedValue({ value: mockEmail })

      jest.spyOn(utils, 'getWorkspaceInvite').mockResolvedValue(mockInvite as any)
      jest.spyOn(utils, 'checkInvite').mockResolvedValue(mockInvite.workspaceUuid)
      jest.spyOn(utils, 'getWorkspaceById').mockResolvedValue(mockWorkspace as any)
      ;(mockDb.getWorkspaceRole as jest.Mock).mockResolvedValue(null)

      await expect(checkJoin(mockCtx, mockDb, mockBranding, mockToken, { inviteId: 'invite-uuid' })).rejects.toThrow(
        new PlatformError(new Status(Severity.ERROR, platform.status.Forbidden, {}))
      )

      expect(mockDb.getWorkspaceRole).toHaveBeenCalledWith(mockAccount.uuid, mockWorkspace.uuid)
    })
  })
})

describe('getSubscriptions', () => {
  const mockCtx = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  } as unknown as MeasureContext

  const mockBranding = null
  const workspaceUuid = 'test-workspace-uuid' as WorkspaceUuid
  const accountUuid = 'test-account-uuid' as AccountUuid

  let mockDb: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockDb = {
      subscription: {
        find: jest.fn()
      },
      getWorkspaceRole: jest.fn()
    }
  })

  test('should return active subscriptions for workspace owner', async () => {
    const mockSubscriptions = [
      {
        id: 'sub-1',
        workspaceUuid,
        accountUuid,
        provider: 'polar',
        providerSubscriptionId: 'polar-sub-123',
        type: 'tier',
        status: 'active',
        plan: 'pro'
      }
    ]

    ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
      account: accountUuid,
      workspace: workspaceUuid,
      extra: {}
    })

    mockDb.getWorkspaceRole.mockResolvedValue(AccountRole.Owner)
    mockDb.subscription.find.mockResolvedValue(mockSubscriptions)

    const result = await getSubscriptions(mockCtx, mockDb, mockBranding, 'test-token', {})

    expect(result).toEqual(mockSubscriptions)
    expect(mockDb.subscription.find).toHaveBeenCalledWith({ workspaceUuid, status: 'active' })
    expect(mockDb.getWorkspaceRole).toHaveBeenCalledWith(accountUuid, workspaceUuid)
  })

  test('should return all subscriptions when activeOnly=false', async () => {
    const mockSubscriptions = [
      {
        id: 'sub-1',
        status: 'active'
      },
      {
        id: 'sub-2',
        status: 'canceled'
      }
    ]

    ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
      account: accountUuid,
      workspace: workspaceUuid,
      extra: {}
    })

    mockDb.getWorkspaceRole.mockResolvedValue(AccountRole.Owner)
    mockDb.subscription.find.mockResolvedValue(mockSubscriptions)

    const result = await getSubscriptions(mockCtx, mockDb, mockBranding, 'test-token', { activeOnly: false })

    expect(result).toEqual(mockSubscriptions)
    expect(mockDb.subscription.find).toHaveBeenCalledWith({ workspaceUuid })
  })

  test('should allow maintainer to view subscriptions', async () => {
    ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
      account: accountUuid,
      workspace: workspaceUuid,
      extra: {}
    })

    mockDb.getWorkspaceRole.mockResolvedValue(AccountRole.Maintainer)
    mockDb.subscription.find.mockResolvedValue([])

    await getSubscriptions(mockCtx, mockDb, mockBranding, 'test-token', {})

    expect(mockDb.getWorkspaceRole).toHaveBeenCalled()
    expect(mockDb.subscription.find).toHaveBeenCalled()
  })

  test('should reject user without sufficient role', async () => {
    ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
      account: accountUuid,
      workspace: workspaceUuid,
      extra: {}
    })

    mockDb.getWorkspaceRole.mockResolvedValue(AccountRole.User)

    await expect(getSubscriptions(mockCtx, mockDb, mockBranding, 'test-token', {})).rejects.toThrow(PlatformError)
  })

  test('should reject user without workspace membership', async () => {
    ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
      account: accountUuid,
      workspace: workspaceUuid,
      extra: {}
    })

    mockDb.getWorkspaceRole.mockResolvedValue(null)

    await expect(getSubscriptions(mockCtx, mockDb, mockBranding, 'test-token', {})).rejects.toThrow(PlatformError)
  })

  test('should allow service to query any workspace', async () => {
    const serviceWorkspaceUuid = 'different-workspace' as WorkspaceUuid

    ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
      account: accountUuid,
      workspace: workspaceUuid,
      extra: { service: 'billing' }
    })

    mockDb.subscription.find.mockResolvedValue([])

    await getSubscriptions(mockCtx, mockDb, mockBranding, 'test-token', { workspaceUuid: serviceWorkspaceUuid })

    expect(mockDb.subscription.find).toHaveBeenCalledWith({ workspaceUuid: serviceWorkspaceUuid, status: 'active' })
    expect(mockDb.getWorkspaceRole).not.toHaveBeenCalled()
  })

  test('should reject non-service users without workspace in token', async () => {
    ;(decodeTokenVerbose as jest.Mock).mockReturnValue({
      account: accountUuid,
      workspace: undefined,
      extra: {}
    })

    await expect(getSubscriptions(mockCtx, mockDb, mockBranding, 'test-token', {})).rejects.toThrow(PlatformError)
  })
})
