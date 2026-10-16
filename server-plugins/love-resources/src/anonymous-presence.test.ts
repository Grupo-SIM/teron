import contact from '@hcengineering/contact'
import core, { type Tx, type UserStatus } from '@hcengineering/core'
import love from '@hcengineering/love'
import { type TriggerControl } from '@hcengineering/server-core'
import { OnPerson, OnUserStatus } from './index'

function fixture (connected: boolean, hasInfo: boolean, hasOffice = false): { control: TriggerControl, remove: jest.Mock, create: jest.Mock } {
  const remove = jest.fn(() => ({ _class: core.class.TxRemoveDoc }))
  const create = jest.fn(() => ({ _class: core.class.TxCreateDoc }))
  const status = { user: 'account', online: false, anonymous: true, connected }
  const control = {
    ctx: {}, branding: {}, hierarchy: { isDerived: () => false },
    txFactory: {
      createTxRemoveDoc: remove,
      createTxCreateDoc: create,
      createTxApplyIf: jest.fn(() => ({ _class: core.class.TxApplyIf }))
    },
    findAll: jest.fn(async (_ctx: unknown, klass: unknown) => {
      if (klass === core.class.UserStatus) return [status]
      if (klass === contact.class.Person) return [{ _id: 'person', name: 'Test User' }]
      if (klass === love.class.Office) return hasOffice ? [{ _id: 'office' }] : []
      if (klass === love.class.ParticipantInfo) return hasInfo ? [{ _id: 'info', _class: klass, space: core.space.Workspace }] : []
      return []
    })
  } as unknown as TriggerControl
  return { control, remove, create }
}

function update (operations: Partial<UserStatus>): Tx {
  return {
    _class: core.class.TxUpdateDoc, objectClass: core.class.UserStatus,
    objectId: 'status', operations
  } as unknown as Tx
}

describe('anonymous office presence', () => {
  it('preserves own room when becoming anonymous', async () => {
    const { control, remove } = fixture(true, true)
    expect(await OnUserStatus([update({ online: false, anonymous: true })], control)).toEqual([])
    expect(remove).not.toHaveBeenCalled()
  })
  it('restores own room after reconnecting anonymously', async () => {
    const { control, create } = fixture(true, false)
    expect(await OnUserStatus([update({ online: false, connected: true })], control)).toHaveLength(1)
    expect(create).toHaveBeenCalledTimes(1)
  })
  it('removes retained room after final anonymous connection closes', async () => {
    const { control, remove } = fixture(false, true)
    expect(await OnUserStatus([update({ online: false, connected: false })], control)).toHaveLength(1)
    expect(remove).toHaveBeenCalledTimes(1)
  })
})

describe('office presence after account linkage', () => {
  const personTx = (create: boolean): Tx => ({
    _class: create ? core.class.TxCreateDoc : core.class.TxUpdateDoc,
    objectClass: contact.class.Person,
    objectId: 'person',
    ...(create ? { attributes: { personUuid: 'account' } } : { operations: { personUuid: 'account' } })
  }) as unknown as Tx

  it.each([true, false])('creates missing presence after account linkage (create=%s)', async (createPerson) => {
    const { control, create } = fixture(true, false)
    expect(await OnPerson([personTx(createPerson)], control)).toHaveLength(1)
    expect(create).toHaveBeenCalledWith(love.class.ParticipantInfo, core.space.Workspace,
      expect.objectContaining({ person: 'person', account: 'account', room: love.ids.Reception }))
  })

  it('uses the linked personal office when available', async () => {
    const { control, create } = fixture(true, false, true)
    await OnPerson([personTx(false)], control)
    expect(create).toHaveBeenCalledWith(love.class.ParticipantInfo, core.space.Workspace,
      expect.objectContaining({ room: 'office' }))
  })

  it('does not create presence for a disconnected account', async () => {
    const { control, create } = fixture(false, false)
    expect(await OnPerson([personTx(false)], control)).toEqual([])
    expect(create).not.toHaveBeenCalled()
  })

  it('preserves existing room when account linkage is repeated', async () => {
    const { control, create } = fixture(true, true)
    expect(await OnPerson([personTx(false)], control)).toEqual([])
    expect(create).not.toHaveBeenCalled()
  })

  it('repairs presence on a connection-only update', async () => {
    const { control, create } = fixture(true, false)
    expect(await OnUserStatus([update({ connected: true })], control)).toHaveLength(1)
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('continues a status batch after an unrelated update', async () => {
    const { control, create } = fixture(true, false)
    expect(await OnUserStatus([update({ anonymous: true }), update({ online: true })], control)).toHaveLength(1)
    expect(create).toHaveBeenCalledTimes(1)
  })
})
