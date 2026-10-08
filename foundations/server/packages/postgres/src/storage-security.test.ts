import { AccountRole } from '@hcengineering/core'
import { PostgresAdapter } from './storage'

it('includes tracker sectors in SQL access checks without granting access to unrelated private spaces', () => {
  // Exercise query generation only; no database or network connection is created.
  const adapter = Object.create(PostgresAdapter.prototype) as PostgresAdapter
  Object.assign(adapter, { workspaceId: 'workspace', hierarchy: { getAncestors: () => [] }, modelDb: { findAllSync: () => [] } })
  const variables = { add: () => '$1' }
  const account = { uuid: 'account', role: AccountRole.User }
  const security = adapter.addSecurity('tracker:class:Issue' as any, variables as any, {}, false, 'task', { account } as any)
  expect(security).toContain(`OR sec."_class" = 'tracker:class:Project'`)
  expect(security).toContain(`sec.members @> '{"account"}'`)
  expect(security).toContain('sec."workspaceId" = $1')
  expect(security).not.toContain('sec.private = false')
})
