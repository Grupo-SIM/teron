<!--
// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.
-->
<script lang="ts">
  import { AccountRole, generateId, getCurrentAccount } from '@hcengineering/core'
  import { Card } from '@hcengineering/presentation'
  import { EditBox, DropdownLabelsIntl, Label, type DropdownIntlItem } from '@hcengineering/ui'
  import { createEventDispatcher } from 'svelte'

  import setting from '../plugin'
  import { getAccountClient } from '../utils'
  import { isPendingSeatChange, isWorkspaceLimitReached } from './seat-billing'

  const accountClient = getAccountClient()
  const dispatch = createEventDispatcher()
  const currentAccount = getCurrentAccount()
  const roles: DropdownIntlItem[] = [
    { id: AccountRole.ReadOnlyGuest, label: setting.string.ReadonlyGuest },
    { id: AccountRole.User, label: setting.string.User },
    { id: AccountRole.Maintainer, label: setting.string.Maintainer }
  ]

  let email = ''
  let role = AccountRole.User
  let saving = false
  let ownerOnly = false
  let pendingPayment = false
  let purchasingSeat = false
  let errorKind: 'invite' | 'payment' | undefined
  let quote: Awaited<ReturnType<typeof accountClient.getWorkspaceSeatQuote>> | undefined
  let operationId: string | undefined

  async function prepareSeatPurchase (): Promise<void> {
    if (currentAccount.role !== AccountRole.Owner) {
      ownerOnly = true
      return
    }
    purchasingSeat = true
    const entitlement = await accountClient.getWorkspaceEntitlement()
    quote = await accountClient.getWorkspaceSeatQuote((entitlement.seatLimit ?? 0) + 1)
  }

  async function sendInvite (): Promise<void> {
    const entitlement = await accountClient.getWorkspaceEntitlement()
    if (entitlement.plan === 'business' && (entitlement.availableSeats ?? 0) <= 0) {
      await prepareSeatPurchase()
      return
    }
    try {
      await accountClient.sendInvite(email.trim(), role)
      dispatch('close', true)
    } catch (err) {
      if (!isWorkspaceLimitReached(err)) throw err
      await prepareSeatPurchase()
    }
  }

  async function buySeatAndInvite (): Promise<void> {
    if (quote == null) return
    operationId ??= generateId()
    let result = await accountClient.changeWorkspaceSeatLimit(quote.targetQuantity, operationId, {
      email: email.trim(),
      role
    })
    pendingPayment = isPendingSeatChange(result.status)
    for (let attempt = 0; attempt < 120 && isPendingSeatChange(result.status); attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const refreshed = await accountClient.getWorkspaceSeatChange(operationId)
      if (refreshed == null) continue
      result = refreshed
      pendingPayment = isPendingSeatChange(result.status)
    }
    if (result.status === 'APPLIED') {
      dispatch('close', true)
      return
    }
    if (!isPendingSeatChange(result.status)) {
      operationId = undefined
      pendingPayment = false
      errorKind = 'payment'
    }
  }

  async function submit (): Promise<void> {
    saving = true
    errorKind = undefined
    try {
      if (quote == null) {
        await sendInvite()
      } else {
        await buySeatAndInvite()
      }
    } catch {
      errorKind = purchasingSeat || quote != null ? 'payment' : 'invite'
      if (errorKind === 'payment') operationId = undefined
      pendingPayment = false
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
    {#if pendingPayment}
      <div><Label label={setting.string.SeatPurchasePending} /></div>
    {/if}
    {#if errorKind != null}
      <div class="error-color">
        <Label label={errorKind === 'payment' ? setting.string.SeatPurchaseFailed : setting.string.InviteMemberFailed} />
      </div>
    {/if}
    {#if quote != null}
      <div class="antiCard flex-col flex-gap-2 p-3">
        <Label
          label={setting.string.SeatPurchaseSummary}
          params={{
            proration: Number(quote.estimatedProrationAmount).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }),
            recurring: Number(quote.nextRecurringAmount).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }),
            renewal: new Date(quote.periodEnd).toLocaleDateString('pt-BR')
          }}
        />
      </div>
    {/if}
  </div>
</Card>
