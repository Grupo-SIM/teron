import core, { type MeasureContext, type Tx } from '@hcengineering/core'
import { type PipelineContext } from '@hcengineering/server-core'
import { SpacePermissionsMiddleware } from './spacePermissions'

class TestPermissions extends SpacePermissionsMiddleware {
  check (ctx: MeasureContext, tx: Tx): void { this.checkPermissions(ctx, tx) }
}

it('ignores sector roles for tracker content, including nested transactions, while enforcing other spaces', () => {
  const hierarchy = { isDerived: (actual: string, expected: string) => actual === expected, getAncestors: (actual: string) => [actual] }
  const modelDb = { findAllSync: () => [{ _id: 'forbid-edit', txClass: core.class.TxUpdateDoc }] }
  const middleware = new TestPermissions({ hierarchy, modelDb } as unknown as PipelineContext)
  const internal = middleware as any
  internal.trackerSpaces.add('tracker-sector')
  internal.restrictedSpaces.add('tracker-sector')
  internal.restrictedSpaces.add('documents')
  const ctx = { contextData: { account: { uuid: 'account', primarySocialId: 'social' } } } as unknown as MeasureContext
  const update = (space: string): Tx => ({ _class: core.class.TxUpdateDoc, objectClass: 'tracker:class:Issue', objectSpace: space, objectId: 'issue', operations: { title: 'Changed' } }) as unknown as Tx
  expect(() => middleware.check(ctx, update('tracker-sector'))).not.toThrow()
  expect(() => middleware.check(ctx, { _class: core.class.TxApplyIf, txes: [update('tracker-sector')] } as unknown as Tx)).not.toThrow()
  expect(() => middleware.check(ctx, update('documents'))).toThrow()
})
