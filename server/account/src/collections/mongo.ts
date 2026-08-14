//
// Copyright © 2024 Hardcore Engineering Inc.
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
  type AccountRole,
  type Data,
  type Person,
  type Version,
  type WorkspaceMemberInfo,
  type WorkspaceUuid,
  type AccountUuid,
  buildSocialIdString,
  type SocialKey,
  type PersonUuid
} from '@hcengineering/core'
import type {
  Collection,
  CreateIndexesOptions,
  Db,
  Filter,
  FindCursor,
  OptionalUnlessRequiredId,
  Sort as RawSort
} from 'mongodb'
import { UUID } from 'mongodb'

import type {
  Account,
  AccountDB,
  AccountEvent,
  AccountAggregatedInfo,
  DbCollection,
  Integration,
  IntegrationSecret,
  Mailbox,
  MailboxSecret,
  Operations,
  OTP,
  Query,
  SocialId,
  Sort,
  UserProfile,
  Subscription,
  SubscriptionEvent,
  WorkspaceData,
  WorkspaceInfoWithStatus,
  WorkspaceInvite,
  WorkspaceInviteData,
  WorkspaceOperation,
  WorkspaceStatus,
  WorkspaceStatusData,
  WorkspacePermission
} from '../types'
import { isShallowEqual } from '../utils'

interface MongoIndex {
  key: Record<string, any>
  options: CreateIndexesOptions & { name: string }
}

function getFilteredQuery<T> (query: Query<T>): Query<T> {
  return Object.entries(query).reduce<Query<T>>((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof Query<T>] = value
    }
    return acc
  }, {})
}

export class MongoDbCollection<T extends Record<string, any>, K extends keyof T | undefined = undefined>
implements DbCollection<T> {
  constructor (
    readonly name: string,
    readonly db: Db,
    readonly idKey?: K
  ) {}

  get collection (): Collection<T> {
    return this.db.collection<T>(this.name)
  }

  /**
   * Ensures indices in the collection or creates new if needed.
   * Drops all other indices that are not in the list.
   * @param indicesToEnsure MongoIndex
   */
  async ensureIndices (indicesToEnsure: MongoIndex[]): Promise<void> {
    try {
      const indices = await this.collection.listIndexes().toArray()

      for (const idx of indices) {
        if (idx.key._id !== undefined) {
          continue
        }

        const isEqualIndex = (ensureIdx: MongoIndex): boolean => {
          const { key, options } = ensureIdx
          const sameKeys = isShallowEqual(idx.key, key)

          if (!sameKeys) {
            return false
          }

          const shortIdxOptions = { ...idx }
          delete shortIdxOptions.key
          delete shortIdxOptions.v

          return isShallowEqual(shortIdxOptions, options)
        }

        if (indicesToEnsure.some(isEqualIndex)) {
          continue
        }

        await this.collection.dropIndex(idx.name)
      }
    } catch (e: any) {
      if (e?.codeName === 'NamespaceNotFound') {
        // Nothing to do, new DB
      } else {
        throw e
      }
    }

    for (const { key, options } of indicesToEnsure) {
      await this.collection.createIndex(key, options)
    }
  }

  async exists (query: Query<T>): Promise<boolean> {
    return (await this.findOne(query)) !== null
  }

  async find (query: Query<T>, sort?: Sort<T>, limit?: number): Promise<T[]> {
    return await this.findCursor(getFilteredQuery(query), sort, limit).toArray()
  }

  findCursor (query: Query<T>, sort?: Sort<T>, limit?: number): FindCursor<T> {
    const cursor = this.collection.find<T>(getFilteredQuery(query) as Filter<T>)

    if (sort !== undefined) {
      cursor.sort(sort as RawSort)
    }

    if (limit !== undefined) {
      cursor.limit(limit)
    }

    return cursor.map((doc) => {
      if (this.idKey !== '_id') {
        delete doc._id
      }

      return doc
    })
  }

  async findOne (query: Query<T>): Promise<T | null> {
    const doc = await this.collection.findOne<T>(getFilteredQuery(query) as Filter<T>)
    if (doc === null) {
      return null
    }

    if (this.idKey !== '_id') {
      delete doc._id
    }
    return doc
  }

  async insertOne (data: Partial<T>): Promise<K extends keyof T ? T[K] : undefined> {
    const toInsert: Partial<T> & {
      _id?: string
    } = { ...data }
    const idKey = this.idKey

    if (idKey !== undefined) {
      const key = new UUID().toJSON()
      toInsert[idKey] = data[idKey] ?? (key as any)
      toInsert._id = toInsert._id ?? toInsert[idKey]
    }

    await this.collection.insertOne(toInsert as OptionalUnlessRequiredId<T>)

    return (idKey !== undefined ? toInsert[idKey] : undefined) as K extends keyof T ? T[K] : undefined
  }

  async insertMany (data: Array<Partial<T>>): Promise<K extends keyof T ? Array<T[K]> : undefined> {
    throw new Error('Not implemented')
  }

  async update (query: Query<T>, ops: Operations<T>): Promise<void> {
    const resOps: any = { $set: {} }

    for (const key of Object.keys(ops)) {
      switch (key) {
        case '$inc': {
          resOps.$inc = ops.$inc
          break
        }
        default: {
          resOps.$set[key] = ops[key]
        }
      }
    }
    await this.collection.updateMany(getFilteredQuery(query) as Filter<T>, resOps)
  }

  async deleteMany (query: Query<T>): Promise<void> {
    await this.collection.deleteMany(getFilteredQuery(query) as Filter<T>)
  }
}

export class AccountMongoDbCollection extends MongoDbCollection<Account, 'uuid'> implements DbCollection<Account> {
  constructor (db: Db) {
    super('account', db, 'uuid')
  }

  private convertToObj (acc: Account): Account {
    return {
      ...acc,
      hash: acc.hash != null ? Buffer.from(acc.hash.buffer) : acc.hash,
      salt: acc.salt != null ? Buffer.from(acc.salt.buffer) : acc.salt
    }
  }

  async find (query: Query<Account>, sort?: Sort<Account>, limit?: number): Promise<Account[]> {
    const res = await super.find(query, sort, limit)

    return res.map((acc: Account) => this.convertToObj(acc))
  }

  async findOne (query: Query<Account>): Promise<Account | null> {
    const res = await this.collection.findOne<Account>(getFilteredQuery(query) as Filter<Account>)

    return res !== null ? this.convertToObj(res) : null
  }
}

export class SocialIdMongoDbCollection extends MongoDbCollection<SocialId, '_id'> implements DbCollection<SocialId> {
  constructor (db: Db) {
    super('socialId', db, '_id')
  }

  async insertOne (data: Partial<SocialId>): Promise<any> {
    if (data.type === undefined || data.value === undefined) {
      throw new Error('Type and value are required')
    }

    return await super.insertOne({
      ...data,
      key: buildSocialIdString(data as SocialKey)
    })
  }
}

export class WorkspaceStatusMongoDbCollection implements DbCollection<WorkspaceStatus> {
  constructor (private readonly wsCollection: MongoDbCollection<WorkspaceInfoWithStatus, 'uuid'>) {}

  private toWsQuery (query: Query<WorkspaceStatus>): Query<WorkspaceInfoWithStatus> {
    const res: Query<WorkspaceInfoWithStatus> = {}

    for (const key of Object.keys(getFilteredQuery(query))) {
      const qVal = (query as any)[key]
      if (key === 'workspaceUuid') {
        res.uuid = qVal
      } else {
        if (res.status === undefined) {
          res.status = {}
        }

        ;(res.status as any)[key] = qVal
      }
    }

    return res
  }

  private toWsSort (sort?: Sort<WorkspaceStatus>): Sort<WorkspaceInfoWithStatus> | undefined {
    if (sort === undefined) {
      return undefined
    }

    const res: Sort<WorkspaceInfoWithStatus> = {
      status: {}
    }

    for (const key of Object.keys(sort)) {
      ;(res.status as any)[key] = (sort as any)[key]
    }

    return res
  }

  private toWsOperations (ops: Operations<WorkspaceStatus>): Operations<WorkspaceInfoWithStatus> {
    const res: any = {}

    for (const key of Object.keys(ops)) {
      const op = (ops as any)[key]

      if (key === '$inc') {
        res[key] = {}
        for (const opKey of Object.keys(op)) {
          res[key][`status.${opKey}`] = op[opKey]
        }
      } else if (key === '$set') {
        for (const opKey of Object.keys(op)) {
          res[`status.${opKey}`] = op[opKey]
        }
      } else {
        res[`status.${key}`] = op
      }
    }

    return res
  }

  async exists (query: Query<WorkspaceStatus>): Promise<boolean> {
    return await this.wsCollection.exists(this.toWsQuery(query))
  }

  async find (query: Query<WorkspaceStatus>, sort?: Sort<WorkspaceStatus>, limit?: number): Promise<WorkspaceStatus[]> {
    return (await this.wsCollection.find(this.toWsQuery(query), this.toWsSort(sort), limit)).map((ws) => ({
      ...ws.status,
      workspaceUuid: ws.uuid
    }))
  }

  async findOne (query: Query<WorkspaceStatus>): Promise<WorkspaceStatus | null> {
    return (await this.wsCollection.findOne(this.toWsQuery(query)))?.status ?? null
  }

  async insertOne (data: Partial<WorkspaceStatus>): Promise<any> {
    if (data.workspaceUuid === undefined) {
      throw new Error('workspaceUuid is required')
    }

    const wsData = await this.wsCollection.findOne({ uuid: data.workspaceUuid })

    if (wsData === null) {
      throw new Error(`Workspace with uuid ${data.workspaceUuid} not found`)
    }

    const statusData: any = {}

    for (const key of Object.keys(data)) {
      if (key !== 'workspaceUuid') {
        statusData[`status.${key}`] = (data as any)[key]
      }
    }

    await this.wsCollection.update({ uuid: data.workspaceUuid }, statusData)

    return data.workspaceUuid
  }

  async insertMany (data: Partial<WorkspaceStatus>[]): Promise<any> {
    throw new Error('Not implemented')
  }

  async update (query: Query<WorkspaceStatus>, ops: Operations<WorkspaceStatus>): Promise<void> {
    await this.wsCollection.update(this.toWsQuery(query), this.toWsOperations(ops))
  }

  async deleteMany (query: Query<WorkspaceStatus>): Promise<void> {
    await this.wsCollection.deleteMany(this.toWsQuery(query))
  }
}

interface WorkspaceMember {
  workspaceUuid: WorkspaceUuid
  accountUuid: AccountUuid
  role: AccountRole
}

interface Migration {
  key: string
  op: () => Promise<void>
}

interface MigrationInfo {
  key: string
  completed: boolean
  lastProcessedTime: number
}

export class MongoAccountDB implements AccountDB {
  migration: MongoDbCollection<MigrationInfo, 'key'>
  person: MongoDbCollection<Person, 'uuid'>
  socialId: SocialIdMongoDbCollection
  workspace: MongoDbCollection<WorkspaceInfoWithStatus, 'uuid'>
  workspaceStatus: WorkspaceStatusMongoDbCollection
  account: AccountMongoDbCollection
  accountEvent: MongoDbCollection<AccountEvent>
  otp: MongoDbCollection<OTP>
  invite: MongoDbCollection<WorkspaceInvite, 'id'>
  mailbox: MongoDbCollection<Mailbox, 'mailbox'>
  mailboxSecret: MongoDbCollection<MailboxSecret>
  integration: MongoDbCollection<Integration>
  integrationSecret: MongoDbCollection<IntegrationSecret>
  userProfile: MongoDbCollection<UserProfile, 'personUuid'>
  subscription: MongoDbCollection<Subscription, 'id'>
  subscriptionEvent: MongoDbCollection<SubscriptionEvent, 'id'>

  workspaceMembers: MongoDbCollection<WorkspaceMember>
  workspacePermission: MongoDbCollection<WorkspacePermission>

  constructor (readonly db: Db) {
    this.migration = new MongoDbCollection<MigrationInfo, 'key'>('migration', db, 'key')
    this.person = new MongoDbCollection<Person, 'uuid'>('person', db, 'uuid')
    this.socialId = new SocialIdMongoDbCollection(db)
    this.workspace = new MongoDbCollection<WorkspaceInfoWithStatus, 'uuid'>('workspace', db, 'uuid')
    this.workspaceStatus = new WorkspaceStatusMongoDbCollection(this.workspace)
    this.account = new AccountMongoDbCollection(db)
    this.accountEvent = new MongoDbCollection<AccountEvent>('accountEvent', db)
    this.otp = new MongoDbCollection<OTP>('otp', db)
    this.invite = new MongoDbCollection<WorkspaceInvite, 'id'>('invite', db, 'id')
    this.mailbox = new MongoDbCollection<Mailbox, 'mailbox'>('mailbox', db)
    this.mailboxSecret = new MongoDbCollection<MailboxSecret>('mailboxSecrets', db)
    this.integration = new MongoDbCollection<Integration>('integration', db)
    this.integrationSecret = new MongoDbCollection<IntegrationSecret>('integrationSecret', db)
    this.userProfile = new MongoDbCollection<UserProfile, 'personUuid'>('user_profile', db, 'personUuid')
    this.subscription = new MongoDbCollection<Subscription, 'id'>('subscription', db, 'id')
    this.subscriptionEvent = new MongoDbCollection<SubscriptionEvent, 'id'>('subscriptionEvent', db, 'id')

    this.workspaceMembers = new MongoDbCollection<WorkspaceMember>('workspaceMembers', db)
    this.workspacePermission = new MongoDbCollection<WorkspacePermission>('workspacePermissions', db)
  }

  async init (): Promise<void> {
    // Apply all the migrations
    for (const migration of this.getMigrations()) {
      await this.migrate(migration)
    }

    await this.account.ensureIndices([
      {
        key: { uuid: 1 },
        options: { unique: true, name: 'hc_account_account_uuid_1' }
      }
    ])

    await this.socialId.ensureIndices([
      {
        key: { type: 1, value: 1 },
        options: { unique: true, name: 'hc_account_social_id_type_value_1' }
      }
    ])

    await this.workspace.ensureIndices([
      {
        key: { uuid: 1 },
        options: {
          unique: true,
          name: 'hc_account_workspace_uuid_1'
        }
      },
      {
        key: { url: 1 },
        options: {
          unique: true,
          name: 'hc_account_workspace_url_1'
        }
      }
    ])

    await this.workspaceMembers.ensureIndices([
      {
        key: { workspaceUuid: 1 },
        options: {
          name: 'hc_account_workspace_members_workspace_uuid_1'
        }
      },
      {
        key: { accountUuid: 1 },
        options: {
          name: 'hc_account_workspace_members_account_uuid_1'
        }
      }
    ])
  }

  async migrate ({ key, op }: Migration): Promise<void> {
    const { completed, exists } = await this.shouldMigrate(key)
    if (completed) {
      return
    }

    console.log(`Applying migration: ${key}`)
    if (!exists) {
      await this.migration.insertOne({ key, completed: false, lastProcessedTime: Date.now() })
    } else {
      await this.migration.update({ key }, { lastProcessedTime: Date.now() })
    }

    const processingHandle = setInterval(() => {
      void this.migration.update({ key }, { lastProcessedTime: Date.now() })
    }, 1000 * 5)
    await op()
    await this.migration.update({ key }, { completed: true, lastProcessedTime: Date.now() })
    clearInterval(processingHandle)
    console.log(`Migration ${key} completed`)
  }

  async shouldMigrate (key: string): Promise<{ completed: boolean, exists: boolean }> {
    while (true) {
      const migrationInfo = await this.migration.findOne({ key })
      if (migrationInfo?.completed === true) {
        return { completed: true, exists: true }
      }

      if (migrationInfo == null) {
        return { completed: false, exists: false }
      }

      if (migrationInfo.lastProcessedTime === undefined || Date.now() - migrationInfo.lastProcessedTime > 1000 * 15) {
        return { completed: false, exists: true }
      }

      console.log(`Migration ${key} is in progress by other process, waiting...`)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }

  protected getMigrations (): Migration[] {
    return [this.getV1Migration(), this.getV2Migration(), this.getV3Migration()]
  }

  // NOTE: NEVER MODIFY EXISTING MIGRATIONS. IF YOU NEED TO DO SOMETHING, ADD A NEW MIGRATION.
  private getV1Migration (): Migration {
    return {
      key: 'account_db_v1_fill_social_id_ids',
      op: async () => {
        const sidCursor = this.socialId.findCursor({})

        try {
          let sidsCount = 0
          while (await sidCursor.hasNext()) {
            const socialIdObj = await sidCursor.next()
            if (socialIdObj == null) break

            if (socialIdObj._id != null && socialIdObj._id !== socialIdObj.key) continue

            await this.socialId.deleteMany({ key: socialIdObj.key })
            const newSocialId: any = { ...socialIdObj }
            delete newSocialId._id
            await this.socialId.insertOne(newSocialId)

            sidsCount++
          }

          console.log(`Migrated ${sidsCount} social ids`)
        } finally {
          await sidCursor.close()
        }
      }
    }
  }

  private getV2Migration (): Migration {
    return {
      key: 'account_db_v2_populate_user_profiles',
      op: async () => {
        // Create user_profile entries for all existing persons that don't have one
        const accountCursor = this.account.findCursor({})

        try {
          let profilesCreated = 0
          while (await accountCursor.hasNext()) {
            const account = await accountCursor.next()
            if (account == null) break

            const existingProfile = await this.userProfile.findOne({ personUuid: account.uuid })
            if (existingProfile == null) {
              await this.userProfile.insertOne({
                personUuid: account.uuid,
                isPublic: false
              })
              profilesCreated++
            }
          }

          console.log(`Created ${profilesCreated} user profiles`)
        } finally {
          await accountCursor.close()
        }
      }
    }
  }

  private getV3Migration (): Migration {
    return {
      key: 'account_db_v3_workspace_subscriptions',
      op: async () => {
        const now = Date.now()
        const trialEnd = now + 30 * 24 * 60 * 60 * 1000
        const workspaces = (await this.workspace.find({})) ?? []
        for (const workspace of workspaces) {
          const tiers = await this.subscription.find({ workspaceUuid: workspace.uuid, type: 'tier' as any })
          const sortedTiers = tiers.sort((a, b) => b.updatedOn - a.updatedOn)
          const effectiveStatuses = ['active', 'trialing', 'past_due']
          const paidLegacyTier = sortedTiers.find(
            (it) => ['rare', 'epic', 'legendary'].includes(it.plan) && effectiveStatuses.includes(it.status)
          )
          const commonTier = sortedTiers.find((it) => it.plan === 'common')
          const currentBusinessTier = sortedTiers.find(
            (it) => it.plan === 'business' && effectiveStatuses.includes(it.status)
          )
          const currentFreeTier = sortedTiers.find(
            (it) => it.plan === 'free' && effectiveStatuses.includes(it.status)
          )
          let tier = paidLegacyTier ?? currentBusinessTier ?? commonTier ?? currentFreeTier
          if (tier == null) {
            const accountUuid = workspace.billingAccount ?? workspace.createdBy
            if (accountUuid == null) continue
            const id = `free:${workspace.uuid}`
            await this.subscription.insertOne({
              id,
              workspaceUuid: workspace.uuid,
              accountUuid: accountUuid as AccountUuid,
              provider: 'internal',
              providerSubscriptionId: id,
              type: 'tier' as any,
              status: 'trialing' as any,
              plan: 'free',
              periodStart: now,
              periodEnd: trialEnd,
              trialEnd,
              createdOn: now,
              updatedOn: now
            })
            tier = await this.subscription.findOne({ id })
          } else if (tier === paidLegacyTier) {
            const members = await this.getWorkspaceMembers(workspace.uuid)
            const invites = await this.invite.find({
              workspaceUuid: workspace.uuid,
              remainingUses: { $gt: 0 }
            })
            const memberSeats = members.filter((it) =>
              [AccountRole.Owner, AccountRole.Maintainer, AccountRole.User, AccountRole.Guest].includes(it.role)
            ).length
            const occupied =
              memberSeats +
              invites.filter(
                (it) => (it.expiresOn === -1 || it.expiresOn > now) && it.email != null && it.email !== ''
              ).length
            await this.subscription.update({ id: tier.id }, { plan: 'business', seatLimit: Math.max(1, occupied) })
            tier = { ...tier, plan: 'business', seatLimit: Math.max(1, occupied) }
          } else if (tier === commonTier) {
            await this.subscription.update(
              { id: tier.id },
              {
                plan: 'free',
                status: 'trialing' as any,
                periodStart: now,
                periodEnd: trialEnd,
                trialEnd
              }
            )
            await this.subscription.collection.updateOne(
              { id: tier.id },
              { $unset: { seatLimit: '', nextSeatLimit: '' } }
            )
            tier = { ...tier, plan: 'free', periodStart: now, periodEnd: trialEnd, trialEnd }
          }

          if (tier != null && !(await this.subscriptionEvent.exists({ subscriptionId: tier.id }))) {
            await this.subscriptionEvent.insertOne({
              id: `migration:${tier.id}`,
              subscriptionId: tier.id,
              workspaceUuid: workspace.uuid,
              eventType: 'created',
              periodStart: tier.periodStart,
              periodEnd: tier.periodEnd,
              seatLimit: tier.seatLimit,
              nextSeatLimit: tier.nextSeatLimit,
              createdOn: now
            })
          }

          if (workspace.createdBy != null) {
            await this.account.collection.updateOne(
              {
                uuid: workspace.createdBy as AccountUuid,
                $or: [{ freeTrialUsedOn: { $exists: false } }, { freeTrialUsedOn: null }]
              },
              { $set: { freeTrialUsedOn: now, freeTrialWorkspaceUuid: workspace.uuid } }
            )
          }
        }
      }
    }
  }

  async assignWorkspace (accountId: AccountUuid, workspaceId: WorkspaceUuid, role: AccountRole): Promise<void> {
    await this.workspaceMembers.insertOne({
      workspaceUuid: workspaceId,
      accountUuid: accountId,
      role
    })
  }

  async claimFreeTrial (accountId: AccountUuid, claimedOn: number): Promise<boolean> {
    const result = await this.account.collection.findOneAndUpdate(
      { uuid: accountId, $or: [{ freeTrialUsedOn: { $exists: false } }, { freeTrialUsedOn: null }] },
      { $set: { freeTrialUsedOn: claimedOn } },
      { returnDocument: 'after' }
    )
    return result != null
  }

  async setFreeTrialWorkspace (accountId: AccountUuid, workspaceId: WorkspaceUuid): Promise<void> {
    await this.account.collection.updateOne({ uuid: accountId }, { $set: { freeTrialWorkspaceUuid: workspaceId } })
  }

  async reserveSeatAndCreateInvite (data: WorkspaceInviteData, capacity: number): Promise<string | null> {
    const lockToken = new UUID().toJSON()
    const expiresAt = Date.now() + 10000
    for (let attempt = 0; attempt < 20; attempt++) {
      const locked = await this.workspace.collection.findOneAndUpdate(
        {
          uuid: data.workspaceUuid,
          $or: [
            { seatReservationLock: { $exists: false } },
            { 'seatReservationLock.expiresAt': { $lt: Date.now() } }
          ]
        } as any,
        { $set: { seatReservationLock: { token: lockToken, expiresAt } } } as any,
        { returnDocument: 'after' }
      )
      if (locked == null) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        continue
      }
      try {
        const members = await this.getWorkspaceMembers(data.workspaceUuid)
        const invites = await this.invite.find({
          workspaceUuid: data.workspaceUuid,
          remainingUses: { $gt: 0 }
        })
        const now = Date.now()
        const memberSeats = members.filter((it) =>
          [AccountRole.Owner, AccountRole.Maintainer, AccountRole.User, AccountRole.Guest].includes(it.role)
        ).length
        const used =
          memberSeats +
          invites.filter(
            (it) => (it.expiresOn === -1 || it.expiresOn > now) && it.email != null && it.email !== ''
          ).length
        return used >= capacity ? null : await this.invite.insertOne(data)
      } finally {
        await this.workspace.collection.updateOne(
          { uuid: data.workspaceUuid, 'seatReservationLock.token': lockToken } as any,
          { $unset: { seatReservationLock: '' } } as any
        )
      }
    }
    return null
  }

  async consumeInviteAndAssignWorkspace (
    inviteId: string,
    accountId: AccountUuid,
    workspaceId: WorkspaceUuid,
    role: AccountRole
  ): Promise<boolean> {
    const lockToken = new UUID().toJSON()
    const expiresAt = Date.now() + 10000
    for (let attempt = 0; attempt < 20; attempt++) {
      const locked = await this.workspace.collection.findOneAndUpdate(
        {
          uuid: workspaceId,
          $or: [
            { seatReservationLock: { $exists: false } },
            { 'seatReservationLock.expiresAt': { $lt: Date.now() } }
          ]
        } as any,
        { $set: { seatReservationLock: { token: lockToken, expiresAt } } } as any,
        { returnDocument: 'after' }
      )
      if (locked == null) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        continue
      }
      try {
        const now = Date.now()
        const claimed = await this.invite.collection.findOneAndUpdate(
          {
            id: inviteId,
            workspaceUuid: workspaceId,
            remainingUses: { $gt: 0 },
            $or: [{ expiresOn: -1 }, { expiresOn: { $gt: now } }]
          } as any,
          { $inc: { remainingUses: -1 } } as any,
          { returnDocument: 'after' }
        )
        if (claimed == null) return false
        try {
          await this.assignWorkspace(accountId, workspaceId, role)
        } catch (err) {
          await this.invite.collection.updateOne({ id: inviteId }, { $inc: { remainingUses: 1 } })
          throw err
        }
        return true
      } finally {
        await this.workspace.collection.updateOne(
          { uuid: workspaceId, 'seatReservationLock.token': lockToken } as any,
          { $unset: { seatReservationLock: '' } } as any
        )
      }
    }
    return false
  }

  async releaseFreeTrial (accountId: AccountUuid, claimedOn: number): Promise<void> {
    await this.account.collection.updateOne(
      { uuid: accountId, freeTrialUsedOn: claimedOn },
      { $unset: { freeTrialUsedOn: '', freeTrialWorkspaceUuid: '' } }
    )
  }

  async batchAssignWorkspace (data: [AccountUuid, WorkspaceUuid, AccountRole][]): Promise<void> {
    await this.workspaceMembers.insertMany(
      data.map(([accountId, workspaceId, role]) => ({
        workspaceUuid: workspaceId,
        accountUuid: accountId,
        role
      }))
    )
  }

  async unassignWorkspace (accountId: AccountUuid, workspaceId: WorkspaceUuid): Promise<void> {
    await this.workspaceMembers.deleteMany({
      workspaceUuid: workspaceId,
      accountUuid: accountId
    })
  }

  async createWorkspace (data: WorkspaceData, status: WorkspaceStatusData): Promise<WorkspaceUuid> {
    const res = await this.workspace.insertOne(data)

    await this.workspaceStatus.insertOne({
      workspaceUuid: res,
      ...status
    })

    return res
  }

  async updateAllowReadOnlyGuests (workspaceId: WorkspaceUuid, readOnlyGuestsAllowed: boolean): Promise<void> {
    await this.workspace.update(
      {
        uuid: workspaceId
      },
      { allowReadOnlyGuest: readOnlyGuestsAllowed }
    )
  }

  async updateAllowGuestSignUp (workspaceId: WorkspaceUuid, guestSignUpAllowed: boolean): Promise<void> {
    await this.workspace.update(
      {
        uuid: workspaceId
      },
      { allowGuestSignUp: guestSignUpAllowed }
    )
  }

  async updatePasswordAgingRule (workspaceId: WorkspaceUuid, days: number | null): Promise<void> {
    await this.workspace.update(
      {
        uuid: workspaceId
      },
      { passwordAgingRule: days }
    )
  }

  async getPendingWorkspace (
    region: string,
    version: Data<Version>,
    operation: WorkspaceOperation,
    processingTimeoutMs: number,
    wsLivenessMs?: number
  ): Promise<WorkspaceInfoWithStatus | undefined> {
    const pendingCreationQuery: Filter<WorkspaceInfoWithStatus>['$or'] = [
      { 'status.mode': { $in: ['pending-creation', 'creating'] } }
    ]

    const migrationQuery: Filter<WorkspaceInfoWithStatus>['$or'] = [
      {
        'status.mode': {
          $in: ['migration-backup', 'migration-pending-backup', 'migration-clean', 'migration-pending-clean']
        }
      }
    ]

    const archivingQuery: Filter<WorkspaceInfoWithStatus>['$or'] = [
      {
        'status.mode': {
          $in: ['archiving-pending-backup', 'archiving-backup', 'archiving-pending-clean', 'archiving-clean']
        }
      }
    ]

    const deletingQuery: Filter<WorkspaceInfoWithStatus>['$or'] = [
      { 'status.mode': { $in: ['pending-deletion', 'deleting'] } }
    ]
    const restoreQuery: Filter<WorkspaceInfoWithStatus>['$or'] = [
      { 'status.mode': { $in: ['pending-restore', 'restoring'] } }
    ]

    const versionQuery = {
      $or: [
        { 'status.versionMajor': { $lt: version.major } },
        { 'status.versionMajor': version.major, 'status.versionMinor': { $lt: version.minor } },
        {
          'status.versionMajor': version.major,
          'status.versionMinor': version.minor,
          'status.versionPatch': { $lt: version.patch }
        }
      ]
    }
    const pendingUpgradeQuery: Filter<WorkspaceInfoWithStatus>['$or'] = [
      {
        $and: [
          {
            $or: [{ 'status.isDisabled': false }, { 'status.isDisabled': { $exists: false } }]
          },
          {
            $or: [{ 'status.mode': 'active' }, { 'status.mode': { $exists: false } }]
          },
          versionQuery,
          ...(wsLivenessMs !== undefined
            ? [
                {
                  'status.lastVisit': { $gt: Date.now() - wsLivenessMs }
                }
              ]
            : [])
        ]
      },
      {
        $or: [{ 'status.isDisabled': false }, { 'status.isDisabled': { $exists: false } }],
        'status.mode': 'upgrading'
      }
    ]
    // TODO: support returning pending deletion workspaces when we will actually want
    // to clear them with the worker.

    const defaultRegionQuery = { $or: [{ region: { $exists: false } }, { region: '' }] }
    let operationQuery: Filter<WorkspaceInfoWithStatus> = {}

    switch (operation) {
      case 'create':
        operationQuery = { $or: pendingCreationQuery }
        break
      case 'upgrade':
        operationQuery = { $or: pendingUpgradeQuery }
        break
      case 'all':
        operationQuery = { $or: [...pendingCreationQuery, ...pendingUpgradeQuery] }
        break
      case 'all+backup':
        operationQuery = {
          $or: [
            ...pendingCreationQuery,
            ...pendingUpgradeQuery,
            ...migrationQuery,
            ...archivingQuery,
            ...restoreQuery,
            ...deletingQuery
          ]
        }
        break
    }
    const attemptsQuery = {
      $or: [{ 'status.processingAttempts': { $exists: false } }, { 'status.processingAttempts': { $lte: 3 } }]
    }

    // We must have all the conditions in the DB query and we cannot filter anything in the code
    // because of possible concurrency between account services. We have to update "lastProcessingTime"
    // at the time of retrieval and not after some additional processing.
    const query: Filter<WorkspaceInfoWithStatus> = {
      $and: [
        { 'status.mode': { $ne: 'manual-creation' } },
        operationQuery,
        attemptsQuery,
        region !== '' ? { region } : defaultRegionQuery,
        {
          $or: [
            { 'status.lastProcessingTime': { $exists: false } },
            { 'status.lastProcessingTime': { $lt: Date.now() - processingTimeoutMs } }
          ]
        }
      ]
    }

    return (
      (await this.workspace.collection.findOneAndUpdate(
        query,
        {
          $inc: {
            'status.processingAttempts': 1
          },
          $set: {
            'status.lastProcessingTime': Date.now()
          }
        },
        {
          returnDocument: 'after',
          sort: {
            'status.lastVisit': -1 // Use last visit as a priority
          }
        }
      )) ?? undefined
    )
  }

  async updateWorkspaceRole (accountId: AccountUuid, workspaceId: WorkspaceUuid, role: AccountRole): Promise<void> {
    await this.workspaceMembers.update(
      {
        workspaceUuid: workspaceId,
        accountUuid: accountId
      },
      { role }
    )
  }

  async getWorkspaceRole (accountId: AccountUuid, workspaceId: WorkspaceUuid): Promise<AccountRole | null> {
    const assignment = await this.workspaceMembers.findOne({
      workspaceUuid: workspaceId,
      accountUuid: accountId
    })

    return assignment?.role ?? null
  }

  async getWorkspaceRoles (accountId: AccountUuid): Promise<Map<WorkspaceUuid, AccountRole>> {
    const assignment = await this.workspaceMembers.find({
      accountUuid: accountId
    })

    return assignment.reduce<Map<WorkspaceUuid, AccountRole>>((acc, it) => {
      acc.set(it.workspaceUuid, it.role)
      return acc
    }, new Map())
  }

  async getWorkspaceMembers (workspaceId: WorkspaceUuid): Promise<WorkspaceMemberInfo[]> {
    return (await this.workspaceMembers.find({ workspaceUuid: workspaceId })).map((wmi) => ({
      person: wmi.accountUuid,
      role: wmi.role
    }))
  }

  async getAccountWorkspaces (accountId: AccountUuid): Promise<WorkspaceInfoWithStatus[]> {
    const members = await this.workspaceMembers.find({ accountUuid: accountId })
    const wsIds = members.map((m) => m.workspaceUuid)

    return await this.workspace.find({ uuid: { $in: wsIds } })
  }

  async setPassword (accountId: AccountUuid, passwordHash: Buffer, salt: Buffer): Promise<void> {
    await this.account.update({ uuid: accountId }, { hash: passwordHash, salt })
  }

  async resetPassword (accountId: AccountUuid): Promise<void> {
    await this.account.update({ uuid: accountId }, { hash: null, salt: null })
  }

  async deleteAccount (accountUuid: AccountUuid): Promise<void> {
    const socialIds = await this.socialId.find({ personUuid: accountUuid })

    for (const socialIdObj of socialIds) {
      await this.integrationSecret.deleteMany({ socialId: socialIdObj._id })
      await this.integration.deleteMany({ socialId: socialIdObj._id })
    }

    const mailboxes = await this.mailbox.find({ accountUuid })

    for (const mailboxObj of mailboxes) {
      await this.mailboxSecret.deleteMany({ mailbox: mailboxObj.mailbox })
    }

    await this.mailbox.deleteMany({ accountUuid })

    await this.socialId.update({ personUuid: accountUuid }, { verifiedOn: undefined })
    await this.workspaceMembers.deleteMany({ accountUuid })
    await this.account.deleteMany({ uuid: accountUuid })
  }

  async listAccounts (search?: string, skip?: number, limit?: number): Promise<AccountAggregatedInfo[]> {
    throw new Error('Not implemented')
  }

  async generatePersonUuid (): Promise<PersonUuid> {
    return new UUID().toJSON() as PersonUuid
  }

  async batchAssignWorkspacePermission (
    workspaceId: WorkspaceUuid,
    accountIds: AccountUuid[],
    permission: string
  ): Promise<void> {
    if (accountIds.length === 0) {
      return
    }

    const now = Date.now()
    await this.workspacePermission.insertMany(
      accountIds.map((accountId) => ({
        workspaceUuid: workspaceId,
        accountUuid: accountId,
        permission,
        createdOn: now
      }))
    )
  }

  async batchRevokeWorkspacePermission (
    workspaceId: WorkspaceUuid,
    accountIds: AccountUuid[],
    permission: string
  ): Promise<void> {
    if (accountIds.length === 0) {
      return
    }

    await this.workspacePermission.deleteMany({
      workspaceUuid: workspaceId,
      permission,
      accountUuid: { $in: accountIds }
    })
  }

  async hasWorkspacePermission (
    accountId: AccountUuid,
    workspaceId: WorkspaceUuid,
    permission: string
  ): Promise<boolean> {
    const result = await this.workspacePermission.findOne({
      workspaceUuid: workspaceId,
      accountUuid: accountId,
      permission
    })
    return result !== undefined
  }

  async getWorkspacePermissions (accountId: AccountUuid, permission: string): Promise<WorkspaceUuid[]> {
    const results = await this.workspacePermission.find({
      accountUuid: accountId,
      permission
    })
    return results.map((r) => r.workspaceUuid)
  }

  async getWorkspaceUsersWithPermission (workspaceId: WorkspaceUuid, permission: string): Promise<AccountUuid[]> {
    const results = await this.workspacePermission.find({
      workspaceUuid: workspaceId,
      permission
    })
    return results.map((r) => r.accountUuid)
  }
}
