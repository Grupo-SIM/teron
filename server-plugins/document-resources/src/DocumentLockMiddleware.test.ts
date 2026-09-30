import core, { AccountRole, type DocumentUpdate, type MeasureContext, type SessionData, type TxUpdateDoc } from '@hcengineering/core'
import { type Document } from '@hcengineering/document'
import { type Middleware, type PipelineContext } from '@hcengineering/server-core'
import { DocumentLockMiddleware, removesDocumentLock } from './DocumentLockMiddleware'

describe('removesDocumentLock', () => {
  it('detects direct unlock and $unset transactions', () => {
    expect(removesDocumentLock({ lockedBy: null })).toBe(true)
    expect(removesDocumentLock({ $unset: { lockedBy: 1 } })).toBe(true)
    expect(removesDocumentLock({ $unset: { lockedBy: undefined } })).toBe(true)
  })

  it('leaves locks and unrelated changes available to regular users', () => {
    expect(removesDocumentLock({ title: 'Diretriz' })).toBe(false)
    expect(removesDocumentLock({ lockedBy: 'account' } as DocumentUpdate<Document>)).toBe(false)
  })
})

describe('DocumentLockMiddleware', () => {
  const unlock = {
    _class: core.class.TxUpdateDoc,
    objectClass: core.class.Doc,
    operations: { lockedBy: null }
  } as TxUpdateDoc<Document>

  async function validate (role: AccountRole, primarySocialId = 'person'): Promise<jest.Mock> {
    const nextTx = jest.fn(async () => ({}))
    const next = { tx: nextTx } as unknown as Middleware
    const context = { hierarchy: { isDerived: () => true } } as unknown as PipelineContext
    const middleware = await DocumentLockMiddleware.create({} as MeasureContext, context, next)
    const ctx = {
      contextData: { account: { role, primarySocialId } }
    } as MeasureContext<SessionData>
    await middleware.tx(ctx, [unlock])
    return nextTx
  }

  it('rejects regular members before forwarding an unlock', async () => {
    await expect(validate(AccountRole.User)).rejects.toThrow('Only workspace administrators')
  })

  it('allows maintainers and the system account', async () => {
    expect(await validate(AccountRole.Maintainer)).toHaveBeenCalledTimes(1)
    expect(await validate(AccountRole.Owner)).toHaveBeenCalledTimes(1)
    expect(await validate(AccountRole.User, core.account.System)).toHaveBeenCalledTimes(1)
  })
})
