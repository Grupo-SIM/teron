import assert from 'node:assert/strict'
import postgres from 'postgres'
import { MongoClient } from 'mongodb'
import { AccountRole, type WorkspaceUuid, type AccountUuid } from '@hcengineering/core'
import { MongoAccountDB } from '../collections/mongo'
import { PostgresAccountDB } from '../collections/postgres/postgres'
import { convertLegacyReadOnlyMembers } from '../legacy-roles'
import type { AccountDB } from '../types'
const workspace = '00000000-0000-0000-0000-000000000001' as WorkspaceUuid
const owner = '00000000-0000-0000-0000-000000000002' as AccountUuid
const first = '00000000-0000-0000-0000-000000000003' as AccountUuid
const second = '00000000-0000-0000-0000-000000000004' as AccountUuid
async function verify (db: AccountDB, reset: (capacity: number, invite?: boolean) => Promise<void>): Promise<void> {
  await reset(2)
  await Promise.all([convertLegacyReadOnlyMembers(db, workspace), convertLegacyReadOnlyMembers(db, workspace)])
  let members = await db.getWorkspaceMembers(workspace)
  assert.equal(members.filter((member) => member.role === AccountRole.User).length, 1, 'one concurrent reservation wins the final seat')
  assert.equal((await convertLegacyReadOnlyMembers(db, workspace)).converted.length, 0)
  assert.equal((await convertLegacyReadOnlyMembers(db, workspace)).pending.length, 1)
  await reset(3)
  assert.equal((await convertLegacyReadOnlyMembers(db, workspace)).converted.length, 2)
  assert.deepEqual(await convertLegacyReadOnlyMembers(db, workspace), { converted: [], pending: [] })
  await reset(1)
  assert.equal((await convertLegacyReadOnlyMembers(db, workspace)).pending.length, 2)
  await reset(2, true)
  assert.equal((await convertLegacyReadOnlyMembers(db, workspace)).pending.length, 2, 'pending invitations consume capacity')
  members = await db.getWorkspaceMembers(workspace)
  assert.equal(members.find((member) => member.person === owner)?.role, AccountRole.Owner)
}
async function main (): Promise<void> {
  const pgUrl = process.env.TERON_ROLE_POSTGRES_URL!
  const mongoUrl = process.env.TERON_ROLE_MONGO_URL!
  if (!new URL(pgUrl).hostname.startsWith('teron-0004-roles-') || !new URL(mongoUrl).hostname.startsWith('teron-0004-roles-')) throw new Error('Only disposable role regression databases are supported.')
  const sql = postgres(pgUrl)
  const mongo = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 60000 })
  try {
    await mongo.connect()
    await sql`CREATE SCHEMA regression`
    await sql`CREATE TABLE regression.workspace (uuid uuid PRIMARY KEY)`
    await sql`CREATE TABLE regression.workspace_members (workspace_uuid uuid, account_uuid uuid, role text, PRIMARY KEY(workspace_uuid, account_uuid))`
    await sql`CREATE TABLE regression.invite (workspace_uuid uuid, email text, expires_on bigint, remaining_uses int)`
    await sql`CREATE TABLE regression.subscription (id text, workspace_uuid uuid, type text, plan text, status text, seat_limit int, updated_on bigint)`
    await sql`INSERT INTO regression.workspace VALUES (${workspace})`
    const pg = new PostgresAccountDB(sql, 'regression', 'postgres')
    await verify(pg, async (capacity, invite = false) => {
      await sql`TRUNCATE regression.workspace_members, regression.subscription, regression.invite`
      for (const [person, role] of [[owner, AccountRole.Owner], [first, AccountRole.ReadOnlyGuest], [second, AccountRole.ReadOnlyGuest]]) await sql`INSERT INTO regression.workspace_members VALUES (${workspace}, ${person}, ${role})`
      await sql`INSERT INTO regression.subscription VALUES ('tier', ${workspace}, 'tier', 'business', 'active', ${capacity}, ${Date.now()})`
      if (invite) await sql`INSERT INTO regression.invite VALUES (${workspace}, 'pending@regression.local', -1, 1)`
    })
    const db = mongo.db('regression')
    const mg = new MongoAccountDB(db)
    await db.collection('workspace').insertOne({ uuid: workspace })
    await verify(mg, async (capacity, invite = false) => {
      await Promise.all(['workspaceMembers', 'subscription', 'invite'].map(async (name) => await db.collection(name).deleteMany({})))
      await db.collection('workspaceMembers').insertMany([[owner, AccountRole.Owner], [first, AccountRole.ReadOnlyGuest], [second, AccountRole.ReadOnlyGuest]].map(([accountUuid, role]) => ({ workspaceUuid: workspace, accountUuid, role })))
      await db.collection('subscription').insertOne({ id: 'tier', workspaceUuid: workspace, type: 'tier', plan: 'business', status: 'active', seatLimit: capacity, updatedOn: Date.now() })
      if (invite) await db.collection('invite').insertOne({ workspaceUuid: workspace, email: 'pending@regression.local', expiresOn: -1, remainingUses: 1 })
    })
    console.log('Legacy role migration: real MongoDB/PostgreSQL capacity, pending invitations, concurrent final-seat reservation and repeat execution passed.')
  } finally {
    await mongo.close()
    await sql.end()
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
