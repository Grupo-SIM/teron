import core, { AccountRole, type MeasureContext, type SessionData } from '@hcengineering/core'
import { type Middleware, type PipelineContext } from '@hcengineering/server-core'
import { SpaceSecurityMiddleware } from './spaceSecurity'

const projectClass = 'tracker:class:Project'
const issueClass = 'tracker:class:Issue'

describe('tracker workspace access', () => {
  it.each([AccountRole.User, AccountRole.ReadOnlyGuest])('opens private tracker sectors to %s while keeping other private spaces restricted', async (role) => {
    const findAll = jest.fn(async (_ctx: unknown, _class: unknown, _query: unknown) => [])
    const next = { findAll, groupBy: async () => new Map([['tracker-sector', 1], ['private-documents', 1]]) } as unknown as Middleware
    const hierarchy = { isDerived: (actual: string, expected: string) => actual === expected || actual === projectClass && expected === core.class.Space, getDomain: () => 'task' }
    const middleware = await SpaceSecurityMiddleware.create(false, {} as MeasureContext, { hierarchy } as unknown as PipelineContext, next)
    middleware.wasInit = true
    const internal = middleware as any
    internal.addSpace({ _id: 'tracker-sector', _class: projectClass, members: ['other'], private: true, archived: false })
    internal.addSpace({ _id: 'private-documents', _class: core.class.Space, members: ['other'], private: true, archived: false })
    const ctx = { contextData: { account: { uuid: 'account', role } } } as MeasureContext<SessionData>
    await middleware.findAll(ctx, issueClass as any, { space: 'tracker-sector' } as any)
    expect(findAll.mock.calls[0][2]).toEqual({ space: 'tracker-sector' })
    await middleware.findAll(ctx, 'document:class:Document' as any, { space: 'private-documents' } as any)
    expect(findAll.mock.calls[1][2]).toEqual({ space: { $in: [] } })
  })
})
