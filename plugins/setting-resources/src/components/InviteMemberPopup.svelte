<!--
// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.
-->
<script lang="ts">
  import { AccountRole } from '@hcengineering/core'
  import { Card } from '@hcengineering/presentation'
  import { Button, DropdownLabelsIntl, EditBox, Label, type DropdownIntlItem } from '@hcengineering/ui'
  import { createEventDispatcher } from 'svelte'

  import setting from '../plugin'
  import { getAccountClient } from '../utils'
  import { isWorkspaceLimitReached } from './seat-billing'

  const accountClient = getAccountClient()
  const dispatch = createEventDispatcher()
  const roles: DropdownIntlItem[] = [
    { id: AccountRole.User, label: setting.string.User },
    { id: AccountRole.Maintainer, label: setting.string.Maintainer }
  ]

  let email = ''
  let role = AccountRole.User
  let saving = false
  let noAvailableSeats = false
  let inviteFailed = false
  let retryPendingInvite = false

  async function sendInvite (): Promise<void> {
    const entitlement = await accountClient.getWorkspaceEntitlement()
    if (entitlement.plan === 'business' && (entitlement.availableSeats ?? 0) <= 0) {
      noAvailableSeats = true
      return
    }

    await accountClient.sendInvite(email.trim(), role)
    dispatch('close', true)
  }

  async function submit (): Promise<void> {
    saving = true
    noAvailableSeats = false
    inviteFailed = false
    try {
      if (retryPendingInvite) {
        await accountClient.resendInvite(email.trim(), role)
        dispatch('close', true)
      } else {
        await sendInvite()
      }
    } catch (err) {
      noAvailableSeats = isWorkspaceLimitReached(err)
      inviteFailed = !noAvailableSeats
      if (inviteFailed && !retryPendingInvite) {
        const normalizedEmail = email.trim().toLowerCase()
        const pendingInvites = await accountClient.getWorkspacePendingInvites().catch(() => [])
        retryPendingInvite = pendingInvites.some((invite) => invite.email.trim().toLowerCase() === normalizedEmail)
      }
    } finally {
      saving = false
    }
  }
</script>

<Card label={setting.string.InviteMember} okAction={() => {}} canSave={false} on:close={() => dispatch('close')}>
  <div class="flex-col flex-gap-3 min-w-80">
    <EditBox
      bind:value={email}
      placeholder={setting.string.InviteEmailPlaceholder}
      kind="large-style"
      autoFocus
    />
    <DropdownLabelsIntl
      label={setting.string.Role}
      items={roles}
      selected={role}
      on:selected={(event) => (role = event.detail)}
    />
    {#if noAvailableSeats}
      <div class="error-color"><Label label={setting.string.SeatLimitOwnerOnly} /></div>
    {/if}
    {#if inviteFailed}
      <div class="error-color"><Label label={setting.string.InviteMemberFailed} /></div>
    {/if}
  </div>
  <svelte:fragment slot="after-buttons">
    <Button
      label={setting.string.InviteMember}
      kind="primary"
      size="large"
      minWidth="5rem"
      loading={saving}
      disabled={!email.trim().includes('@') || saving || noAvailableSeats}
      on:click={() => void submit()}
    />
  </svelte:fragment>
</Card>
