// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.

import platform, { PlatformError, Severity, Status } from '@hcengineering/platform'

import { isPendingSeatChange, isWorkspaceLimitReached } from './seat-billing'

describe('seat billing helpers', () => {
  it('recognizes platform and deserialized workspace limit errors', () => {
    expect(
      isWorkspaceLimitReached(
        new PlatformError(
          new Status(Severity.ERROR, platform.status.WorkspaceLimitReached, { workspace: 'workspace-id' })
        )
      )
    ).toBe(true)
    expect(
      isWorkspaceLimitReached({
        error: {
          severity: 'ERROR',
          code: platform.status.WorkspaceLimitReached,
          params: { workspace: 'workspace-id' }
        }
      })
    ).toBe(true)
    expect(isWorkspaceLimitReached({ status: { code: platform.status.BadRequest } })).toBe(false)
  })

  it('recognizes provider states that still need polling', () => {
    expect(isPendingSeatChange('PENDING_PAYMENT')).toBe(true)
    expect(isPendingSeatChange('PENDING_RECURRENCE_UPDATE')).toBe(true)
    expect(isPendingSeatChange('APPLIED')).toBe(false)
    expect(isPendingSeatChange('FAILED')).toBe(false)
  })
})
