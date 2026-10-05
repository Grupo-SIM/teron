import core, { TxProcessor, type Doc, type MeasureContext, type SessionData, type Tx, type TxApplyIf, type TxCreateDoc, type TxUpdateDoc } from '@hcengineering/core'
import task, { getTaskAssignees, type TaskAssignees } from '@hcengineering/task'
import tracker from '@hcengineering/tracker'
import { BaseMiddleware, type Middleware, type PipelineContext, type TxMiddlewareResult } from '@hcengineering/server-core'

export function normalizeAssignmentData (data: Record<string, any>): Record<string, any> {
  if (data.assignees !== undefined && (!Array.isArray(data.assignees) || data.assignees.some((id: unknown) => typeof id !== 'string'))) throw new Error('Assignees must be a list of person IDs.')
  if (data.assignee != null && typeof data.assignee !== 'string') throw new Error('Invalid legacy assignee.')
  const normalized: Record<string, any> = { ...data, assignees: getTaskAssignees(data as TaskAssignees) }
  delete normalized.assignee
  if (Array.isArray(data.children)) normalized.children = data.children.map(normalizeAssignmentData)
  return normalized
}

/** Normalize old integrations at the server boundary; new transactions persist lists only. */
export class TaskAssigneesMiddleware extends BaseMiddleware {
  static async create (_ctx: MeasureContext, context: PipelineContext, next?: Middleware): Promise<Middleware> {
    return new TaskAssigneesMiddleware(context, next)
  }
  async tx (ctx: MeasureContext<SessionData>, txes: Tx[]): Promise<TxMiddlewareResult> {
    const flatten = (items: Tx[]): Tx[] => items.flatMap((item) => item._class === core.class.TxApplyIf ? flatten((item as TxApplyIf).txes) : [item])
    for (const tx of flatten(txes)) {
      if (tx._class === core.class.TxCreateDoc) {
        const create = tx as TxCreateDoc<Doc>
        if (this.isTask(create.objectClass)) create.attributes = normalizeAssignmentData(create.attributes)
      } else if (tx._class === core.class.TxUpdateDoc) {
        const update = tx as TxUpdateDoc<Doc>
        if (!this.isTask(update.objectClass)) continue
        const ops = update.operations as Record<string, any>
        const touchesAssignment = Object.entries(ops).some(([key, value]) => key === 'assignee' || key === 'assignees' || (key.startsWith('$') && value !== null && typeof value === 'object' && ('assignee' in value || 'assignees' in value)))
        if (touchesAssignment) {
          const reader = this.context.head ?? this.next
          const doc = (await reader?.findAll(ctx, update.objectClass, { _id: update.objectId }))?.[0]
          if (doc === undefined) throw new Error('Cannot assign an inaccessible task.')
          const simulation = { ...update, operations: { ...ops, ...ops.$set } }
          delete simulation.operations.$set
          const next = TxProcessor.updateDoc2Doc({ ...doc }, simulation) as Doc & TaskAssignees
          const legacy = Object.prototype.hasOwnProperty.call(ops, 'assignee') ? ops : ops.$set
          if (legacy != null && Object.prototype.hasOwnProperty.call(legacy, 'assignee') && !('assignees' in ops) && !('assignees' in (ops.$set ?? {}))) next.assignees = legacy.assignee == null ? [] : [legacy.assignee]
          if (Object.prototype.hasOwnProperty.call(ops.$unset ?? {}, 'assignee') && !('assignees' in ops)) next.assignees = []
          if (Object.prototype.hasOwnProperty.call(ops.$unset ?? {}, 'assignees')) next.assignees = []
          const normalized = normalizeAssignmentData(next)
          const result = { ...ops, ...ops.$set }
          delete result.$set
          delete result.assignee
          delete result.assignees
          for (const [key, value] of Object.entries(result)) {
            if (!key.startsWith('$') || value === null || typeof value !== 'object') continue
            const operator = { ...value }
            delete operator.assignee
            delete operator.assignees
            if (Object.keys(operator).length === 0) delete result[key]
            else result[key] = operator
          }
          result.assignees = normalized.assignees
          result.$unset = { ...result.$unset, assignee: true }
          update.operations = result
        }
        const result = update.operations as Record<string, any>
        if (Array.isArray(result.children)) result.children = result.children.map(normalizeAssignmentData)
        if (Array.isArray(result.$set?.children)) result.$set.children = result.$set.children.map(normalizeAssignmentData)
      }
    }
    return await this.provideTx(ctx, txes)
  }
  private isTask (_class: TxCreateDoc<Doc>['objectClass']): boolean {
    return this.context.hierarchy.isDerived(_class, task.class.Task) || this.context.hierarchy.isDerived(_class, tracker.class.IssueTemplate)
  }
}
