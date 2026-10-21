import core, { createClient, TxOperations } from '@hcengineering/core'
import { LiveQuery } from './index'
import { connect } from './__tests__/connection'

it('updates logical live queries when assignment changes', async () => {
  const storage = await createClient(connect)
  const live = new LiveQuery(storage)
  const factory = new TxOperations(storage, core.account.System)
  storage.notify = (...tx) => { void live.tx(...tx) }
  try {
    const id = await factory.createDoc(core.class.Space, core.space.Model, {
      name: 'unassigned', description: '', private: false, members: [], archived: false
    })
    const callback = jest.fn()
    live.query(core.class.Space, {
      $or: [{ members: 'me' }, { members: { $exists: false }, name: 'legacy' }]
    }, callback)
    const settle = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 100)) }
    const latest = (): any[] => callback.mock.calls[callback.mock.calls.length - 1][0]
    await settle()
    expect(latest()).toHaveLength(0)
    await factory.updateDoc(core.class.Space, core.space.Model, id, { members: ['me'] })
    await settle()
    expect(latest().map((doc) => doc._id)).toEqual([id])
    await factory.updateDoc(core.class.Space, core.space.Model, id, { description: 'still assigned' })
    await settle()
    expect(latest().map((doc) => doc._id)).toEqual([id])
    await factory.updateDoc(core.class.Space, core.space.Model, id, { members: [] })
    await settle()
    expect(latest()).toHaveLength(0)
  } finally {
    await live.close()
  }
})

it('adds newly created documents matching nested assignment predicates immediately', async () => {
  const storage = await createClient(connect)
  const live = new LiveQuery(storage)
  const factory = new TxOperations(storage, core.account.System)
  storage.notify = (...tx) => { void live.tx(...tx) }
  try {
    const callback = jest.fn()
    live.query(core.class.Space, {
      $and: [
        { archived: false },
        { $or: [{ members: 'me' }, { members: { $exists: false }, name: 'legacy' }] }
      ]
    }, callback)
    const settle = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 100)) }
    const latest = (): any[] => callback.mock.calls[callback.mock.calls.length - 1][0]
    await settle()
    expect(latest()).toHaveLength(0)
    const id = await factory.createDoc(core.class.Space, core.space.Model, {
      name: 'assigned', description: '', private: false, members: ['me'], archived: false
    })
    await settle()
    expect(latest().map((doc) => doc._id)).toEqual([id])
    await factory.createDoc(core.class.Space, core.space.Model, {
      name: 'other', description: '', private: false, members: ['someone-else'], archived: false
    })
    await settle()
    expect(latest().map((doc) => doc._id)).toEqual([id])
    await factory.updateDoc(core.class.Space, core.space.Model, id, { archived: true })
    await settle()
    expect(latest()).toHaveLength(0)
  } finally {
    await live.close()
  }
})
