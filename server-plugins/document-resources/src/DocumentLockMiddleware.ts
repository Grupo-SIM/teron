import core, {
  AccountRole,
  hasAccountRole,
  type DocumentUpdate,
  type MeasureContext,
  type SessionData,
  type Tx,
  type TxUpdateDoc
} from '@hcengineering/core'
import document, { type Document } from '@hcengineering/document'
import { BaseMiddleware, type Middleware, type PipelineContext, type TxMiddlewareResult } from '@hcengineering/server-core'

export function removesDocumentLock (operations: DocumentUpdate<Document>): boolean {
  return operations.lockedBy === null || Object.prototype.hasOwnProperty.call(operations.$unset ?? {}, 'lockedBy')
}

/** Reject direct unlock transactions from members without workspace administration rights. */
export class DocumentLockMiddleware extends BaseMiddleware {
  static async create (_ctx: MeasureContext, context: PipelineContext, next?: Middleware): Promise<Middleware> {
    return new DocumentLockMiddleware(context, next)
  }

  async tx (ctx: MeasureContext<SessionData>, txes: Tx[]): Promise<TxMiddlewareResult> {
    const account = ctx.contextData.account
    if (account.primarySocialId !== core.account.System && !hasAccountRole(account, AccountRole.Maintainer)) {
      for (const tx of txes) {
        if (
          tx._class === core.class.TxUpdateDoc &&
          this.context.hierarchy.isDerived((tx as TxUpdateDoc<Document>).objectClass, document.class.Document) &&
          removesDocumentLock((tx as TxUpdateDoc<Document>).operations)
        ) {
          throw new Error('Only workspace administrators can unlock documents.')
        }
      }
    }
    return await this.provideTx(ctx, txes)
  }
}
