import core, {
  AccountRole, hasAccountRole, systemAccountUuid, type Account, type Doc,
  type Tx, type TxApplyIf, type TxCUD
} from '@hcengineering/core'

/** Inspect operator targets, including dotted paths; task edits also support array and counter operators. */
export function changedFields (operations: Record<string, unknown>, allowTaskOperators = false): string[] {
  const fields = new Set<string>()
  for (const [key, value] of Object.entries(operations)) {
    if (key.startsWith('$')) {
      if (key !== '$set' && key !== '$unset' && !(allowTaskOperators && ['$push', '$pull', '$inc', '$update'].includes(key))) return ['*']
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
