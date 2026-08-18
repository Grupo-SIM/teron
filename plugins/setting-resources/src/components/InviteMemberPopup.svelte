<!--
// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.
-->
<script lang="ts">
  import { AccountRole, generateId, getCurrentAccount } from '@hcengineering/core'
  import platform, { PlatformError } from '@hcengineering/platform'
  import { Card } from '@hcengineering/presentation'
  import { EditBox, DropdownLabelsIntl, Label, type DropdownIntlItem } from '@hcengineering/ui'
  import { createEventDispatcher } from 'svelte'

  import setting from '../plugin'
  import { getAccountClient } from '../utils'

  const accountClient = getAccountClient()
  const dispatch = createEventDispatcher()
  const currentAccount = getCurrentAccount()
  const roles: DropdownIntlItem[] = [
    { id: AccountRole.ReadOnlyGuest, label: setting.string.ReadonlyGuest },
    { id: AccountRole.Guest, label: setting.string.Guest },
    { id: AccountRole.User, label: setting.string.User },
    { id: AccountRole.Maintainer, label: setting.string.Maintainer }
  ]

  let email = ''
  let role = AccountRole.User
  let saving = false
  let ownerOnly = false
  let quote: Awaited<ReturnType<typeof accountClient.getWorkspaceSeatQuote>> | undefined
  let operationId: string | undefined

  async function submit (): Promise<void> {
    saving = true
    try {
      if (quote == null) {
        try {
          await accountClient.sendInvite(email.trim(), role)
          dispatch('close', true)
          return
        } catch (err) {
          if (!(err instanceof PlatformError) || err.status.code !== platform.status.WorkspaceLimitReached) throw err
          if (currentAccount.role !== AccountRole.Owner) {
            ownerOnly = true
            return
          }
          const entitlement = await accountClient.getWorkspaceEntitlement()
          quote = await accountClient.getWorkspaceSeatQuote((entitlement.seatLimit ?? 0) + 1)
          return
        }
      }

      operationId ??= generateId()
      let result = await accountClient.changeWorkspaceSeatLimit(quote.targetQuantity, operationId, {
        email: email.trim(),
        role
      })
      for (let attempt = 0; attempt < 120 && ['PENDING_PAYMENT', 'PENDING_RECURRENCE_UPDATE'].includes(result.status); attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        result = await accountClient.getWorkspaceSeatChange(operationId)
      }
      if (result.status === 'APPLIED') dispatch('close', true)
    } finally {
      saving = false
    }
  }
</script>

<Card
  label={quote == null ? setting.string.InviteMember : setting.string.BuySeatAndInvite}
  okAction={submit}
  canSave={email.trim().includes('@') && !ownerOnly && !saving}
  on:close={() => dispatch('close')}
>
  <div class="flex-col flex-gap-3 min-w-80">
    <EditBox
      bind:value={email}
      placeholder={setting.string.InviteEmailPlaceholder}
      kind="large-style"
      autoFocus
      disabled={quote != null}
    />
    <DropdownLabelsIntl
      label={setting.string.Role}
      items={roles}
      selected={role}
      on:selected={(event) => (role = event.detail)}
      disabled={quote != null}
    />
    {#if ownerOnly}
      <div class="error-color"><Label label={setting.string.SeatLimitOwnerOnly} /></div>
    {/if}
    {#if quote != null}
      <div class="antiCard flex-col flex-gap-2 p-3">
        <Label
          label={setting.string.SeatPurchaseSummary}
          params={{
            proration: Number(quote.estimatedProrationAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            recurring: Number(quote.nextRecurringAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          }}
        />
      </div>
    {/if}
  </div>
</Card>
