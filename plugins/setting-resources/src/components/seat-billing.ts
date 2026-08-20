// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.

import platform from '@hcengineering/platform'

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getStatusCode (error: unknown): unknown {
  if (!isRecord(error)) return undefined
  if (isRecord(error.status)) return error.status.code
  if (isRecord(error.error)) return error.error.code
  return undefined
}

export function isWorkspaceLimitReached (error: unknown): boolean {
  return getStatusCode(error) === platform.status.WorkspaceLimitReached
}

export function isPendingSeatChange (status: string): boolean {
  return status === 'PENDING_PAYMENT' || status === 'PENDING_RECURRENCE_UPDATE'
}
