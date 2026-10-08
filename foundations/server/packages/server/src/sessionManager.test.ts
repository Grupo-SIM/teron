import { MeasureMetricsContext, type WorkspaceUuid } from '@hcengineering/core'
import { TSessionManager } from './sessionManager'
import { Workspace } from './workspace'

jest.mock('@hcengineering/account-client', () => ({ getClient: jest.fn(() => ({ updateLastVisit: jest.fn() })) }))
jest.mock('@hcengineering/analytics', () => ({ Analytics: { handleError: jest.fn() } }))

const ctx = new MeasureMetricsContext('presence-test', {})
const workspaceId = 'presence-workspace' as WorkspaceUuid

function setup () {
  const producer = { send: jest.fn().mockResolvedValue(undefined), close: jest.fn() }
  const queue = { getProducer: () => producer, createConsumer: () => ({ close: jest.fn() }) }
  const closeSession = jest.fn().mockResolvedValue(undefined)
  const pipeline = { closeSession, close: jest.fn().mockResolvedValue(undefined) }
  const manager = new TSessionManager(ctx, { pingTimeout: 10000, reconnectTimeout: 30 }, {}, undefined,
    'http://localhost:3000', false, true, queue as any, jest.fn())
  clearInterval(manager.checkInterval)
  const workspace = new Workspace(ctx, 'token', async () => pipeline as any, 0, 300,
    { uuid: workspaceId, url: 'presence' }, null)
  workspace.workspaceInitCompleted = true
  manager.workspaces.set(workspaceId, workspace)
  const setStatus = jest.fn().mockResolvedValue(undefined)
  ;(manager as any).trySetStatus = setStatus
  return { manager, workspace, pipeline, closeSession, setStatus }
}

function addSession (manager: TSessionManager, workspace: Workspace, id: string, user = 'person') {
  const session = { sessionId: id, workspace: { uuid: workspaceId }, requests: new Map(), getUser: () => user, getSocialIds: () => [], getUserSocialIds: () => [],
    binaryMode: false, useCompression: false, createTime: Date.now(), lastRequest: Date.now(), lastPing: Date.now(),
    current: { find: 0, tx: 0 }, mins5: { find: 0, tx: 0 } }
  const socket = { id, close: jest.fn() }
  const entry = { session, socket, tickHash: 1 }
  manager.sessions.set(id, entry as any)
  workspace.sessions.set(id, entry as any)
  return socket
}

function tick (manager: TSessionManager, count: number) {
  for (let i = 0; i < count; i++) manager.handleTick()
}

async function flush () {
  for (let i = 0; i < 12; i++) await Promise.resolve()
}

describe('workspace presence cleanup before idle shutdown', () => {
  test('last tab gets offline cleanup after 30 seconds before workspace closes', async () => {
    const { manager, workspace, pipeline, closeSession, setStatus } = setup()
    const socket = addSession(manager, workspace, 'last')
    await manager.close(ctx, socket as any, workspaceId)
    tick(manager, 300)
    await flush()
    expect(manager.workspaces.has(workspaceId)).toBe(true)
    expect(pipeline.close).not.toHaveBeenCalled()
    expect(setStatus).not.toHaveBeenCalled()
    tick(manager, 300)
    await flush()
    expect(closeSession).toHaveBeenCalledWith(ctx, 'last')
    expect(setStatus).toHaveBeenCalledWith(expect.anything(), pipeline, expect.anything(), false, workspaceId)
    tick(manager, 300)
    await flush()
    expect(pipeline.close).toHaveBeenCalled()
    expect(manager.workspaces.has(workspaceId)).toBe(false)
  })

  test('waits for asynchronous offline write even after handler is removed', async () => {
    const { manager, workspace, pipeline, setStatus } = setup()
    let finish!: () => void
    setStatus.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve }))
    await manager.close(ctx, addSession(manager, workspace, 'last') as any, workspaceId)
    tick(manager, 600)
    await flush()
    expect(workspace.tickHandlers.size).toBe(0)
    expect(workspace.operations).toBe(1)
    tick(manager, 600)
    await flush()
    expect(pipeline.close).not.toHaveBeenCalled()
    finish()
    await flush()
    tick(manager, 300)
    await flush()
    expect(pipeline.close).toHaveBeenCalled()
  })

  test.each(['reconnect', 'other-tab'])('keeps online while %s remains connected', async (mode) => {
    const { manager, workspace, setStatus, closeSession } = setup()
    const last = addSession(manager, workspace, 'last')
    if (mode === 'other-tab') addSession(manager, workspace, 'other')
    await manager.close(ctx, last as any, workspaceId)
    if (mode === 'reconnect') addSession(manager, workspace, 'new')
    tick(manager, 600)
    await flush()
    expect(setStatus).not.toHaveBeenCalled()
    expect(closeSession).not.toHaveBeenCalled()
    expect(manager.workspaces.has(workspaceId)).toBe(true)
    expect(workspace.sessions.size).toBe(1)
  })

  test('closing every tab marks offline only after final tab closes', async () => {
    const { manager, workspace, pipeline, setStatus } = setup()
    const first = addSession(manager, workspace, 'first')
    const last = addSession(manager, workspace, 'last')
    await manager.close(ctx, first as any, workspaceId)
    tick(manager, 600)
    await flush()
    expect(setStatus).not.toHaveBeenCalled()
    await manager.close(ctx, last as any, workspaceId)
    tick(manager, 300)
    await flush()
    expect(setStatus).not.toHaveBeenCalled()
    expect(pipeline.close).not.toHaveBeenCalled()
    tick(manager, 300)
    await flush()
    expect(setStatus).toHaveBeenCalledTimes(1)
    expect(setStatus).toHaveBeenCalledWith(expect.anything(), pipeline, expect.anything(), false, workspaceId)
    tick(manager, 300)
    await flush()
    expect(pipeline.close).toHaveBeenCalledTimes(1)
  })

  test('close check refuses pending cleanup and in-flight operations', async () => {
    const { manager, workspace, pipeline } = setup()
    workspace.tickHandlers.set('pending', { ticks: 600, operation: () => {} })
    await (manager as any).performWorkspaceCloseCheck(workspace)
    expect(pipeline.close).not.toHaveBeenCalled()
    workspace.tickHandlers.clear()
    workspace.operations = 1
    await (manager as any).performWorkspaceCloseCheck(workspace)
    expect(pipeline.close).not.toHaveBeenCalled()
    expect(manager.workspaces.has(workspaceId)).toBe(true)
  })
})
