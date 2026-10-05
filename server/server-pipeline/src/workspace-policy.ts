import core, {
  AccountRole, hasAccountRole, systemAccountUuid, type Account, type Doc,
  type Tx, type TxApplyIf, type TxCUD, type TxUpdateDoc
} from '@hcengineering/core'

/** Inspect operator targets, including dotted paths; never trust client counter updates. */
export function changedFields (operations: Record<string, unknown>): string[] {
  const fields = new Set<string>()
  for (const [key, value] of Object.entries(operations)) {
    if (key.startsWith('$')) {
      if (key !== '$set' && key !== '$unset') return ['*']
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return ['*']
      for (const field of Object.keys(value)) fields.add(field.split('.')[0])
    } else fields.add(key.split('.')[0])
  }
  return [...fields]
}

export function clientTransactions (transactions: Tx[]): TxCUD<Doc>[] {
  const result: TxCUD<Doc>[] = []
  for (const tx of transactions) {
    if (tx._class === core.class.TxApplyIf) result.push(...clientTransactions((tx as TxApplyIf).txes))
    else if ([core.class.TxCreateDoc, core.class.TxUpdateDoc, core.class.TxRemoveDoc, core.class.TxMixin].includes(tx._class as any)) {
      result.push(tx as TxCUD<Doc>)
    } else throw new Error('Unsupported member transaction.')
  }
  return result
}

export function isWorkspaceAdministrator (account: Account): boolean {
  return account.uuid === systemAccountUuid || hasAccountRole(account, AccountRole.Maintainer)
}

export function memberTaskUpdateAllowed (tx: Tx, doc: Doc & { assignees?: string[], assignee?: string | null }, people: string[]): boolean {
  if (tx._class !== core.class.TxUpdateDoc) return false
  const operations = (tx as TxUpdateDoc<Doc>).operations as Record<string, any>
  const fields = changedFields(operations)
  if (fields.includes('status') && typeof (operations.status ?? operations.$set?.status) !== 'string') return false
  if (Object.keys(operations).some((key) => key.includes('.')) || Object.keys(operations.$set ?? {}).some((key) => key.includes('.'))) return false
  if (fields.includes('estimation')) {
    const estimation = operations.estimation ?? operations.$set?.estimation
    if (typeof estimation !== 'number' || !Number.isFinite(estimation) || estimation < 0) return false
  }
  const assigned = (doc.assignees ?? (doc.assignee == null ? [] : [doc.assignee])).some((id) => people.includes(id))
  return fields.every((field) => field === 'description' || field === 'estimation' || (field === 'status' && assigned))
}
