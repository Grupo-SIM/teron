import { type IntlString } from '@hcengineering/platform'

// Resolve at runtime so existing workspaces do not need a model migration.
export function getDeleteConfirmationDefaults (
  ancestors: ReadonlyArray<readonly string[]>
): { confirmation: IntlString, confirmationTitle: IntlString } | undefined {
  if (ancestors.length === 0 || !ancestors.every((classes) => classes.includes('drive:class:File'))) {
    return undefined
  }
  return {
    confirmation: 'drive:string:DeleteFileConfirm' as IntlString,
    confirmationTitle: 'drive:string:DeleteFile' as IntlString
  }
}
