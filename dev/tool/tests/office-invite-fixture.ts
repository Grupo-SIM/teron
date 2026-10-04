import { readFileSync } from 'node:fs'
import core, { TxOperations } from '@hcengineering/core'
import { createClient } from '@hcengineering/server-client'
import contact from '@hcengineering/contact'
import love, { RoomAccess, RoomType } from '../../../plugins/love/src'
async function main (): Promise<void> {
  const state = JSON.parse(readFileSync('/tmp/teron-regression-accounts.json', 'utf8'))
  const raw = await createClient('ws://localhost:30133', state.ownerWs.token, undefined, 30000)
  const client = new TxOperations(raw, state.owner.socialId)
  try {
    const roomId = 'regression-invite-room' as any
    if (!process.argv.includes('--cleanup') && await client.findOne(love.class.Room, { _id: roomId }) === undefined) {
      await client.createDoc(love.class.Room, core.space.Workspace, { name: 'Sala convite regressão', floor: 'regression-floor' as any, x: 3, y: 0, width: 2, height: 1, access: RoomAccess.Open, type: RoomType.Audio, description: null, language: 'pt', startWithRecording: false }, roomId)
    }
    for (const [key, room, x] of [['owner', 'regression-office', 0], ['user', 'regression-invite-room', 0]] as const) {
      const person = await client.findOne(contact.class.Person, { personUuid: state[key].account })
      if (person === undefined) throw new Error('Account fixture person missing')
      const id = `regression-invite-${key}` as any
      const existing = await client.findOne(love.class.ParticipantInfo, { _id: id })
      if (process.argv.includes('--cleanup')) {
        if (existing !== undefined) await client.remove(existing)
      } else if (existing === undefined) {
        await client.createDoc(love.class.ParticipantInfo, core.space.Workspace, { person: person._id, name: person.name, account: state[key].account, room: room as any, x, y: 0, sessionId: null }, id)
      } else if (!process.argv.includes('--cleanup')) {
        await client.update(existing, { room: room as any, x, y: 0 })
      }
    }
  } finally { await raw.close() }
}
void main().catch(error => { console.error(error); process.exitCode = 1 })
