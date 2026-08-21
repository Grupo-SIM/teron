<!--
// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.
-->
<script lang="ts">
  import contact, { Employee, formatName } from '@hcengineering/contact'
  import { EmployeePresenter } from '@hcengineering/contact-resources'
  import { Account, AccountRole, getCurrentAccount, hasAccountRole } from '@hcengineering/core'
  import login from '@hcengineering/login'
  import { getResource } from '@hcengineering/platform'
  import { createQuery, getClient, MessageBox } from '@hcengineering/presentation'
  import {
    Breadcrumb,
    Button,
    DropdownIntlItem,
    DropdownLabelsIntl,
    Header,
    Label,
    Loading,
    Scroller,
    SearchInput,
    getCurrentResolvedLocation,
    navigate,
    showPopup
  } from '@hcengineering/ui'
  import { onMount } from 'svelte'

  import setting from '../plugin'
  import { getAccountClient } from '../utils'
  import InviteMemberPopup from './InviteMemberPopup.svelte'

  const query = createQuery()
  const currentAccount = getCurrentAccount()
  const client = getClient()
  const accountClient = getAccountClient()

  const items: DropdownIntlItem[] = [
    { id: AccountRole.ReadOnlyGuest, label: setting.string.ReadonlyGuest },
    { id: AccountRole.User, label: setting.string.User },
    { id: AccountRole.Maintainer, label: setting.string.Maintainer },
    { id: AccountRole.Owner, label: setting.string.Owner }
  ]
  const guestRoles = [AccountRole.ReadOnlyGuest, AccountRole.DocGuest]

  let workspaceMembers: Record<string, AccountRole> = {}
  let pendingInvites: Awaited<ReturnType<typeof accountClient.getWorkspacePendingInvites>> = []
  let entitlement: Awaited<ReturnType<typeof accountClient.getWorkspaceEntitlement>> | undefined
  let employees: Employee[] = []
  let loading = true
  let search = ''
  let failedInviteEmail: string | undefined

  async function load (): Promise<void> {
    loading = true
    try {
      const [members, invites, currentEntitlement] = await Promise.all([
        accountClient.getWorkspaceMembers(),
        accountClient.getWorkspacePendingInvites(),
        accountClient.getWorkspaceEntitlement()
      ])
      workspaceMembers = members.reduce<Record<string, AccountRole>>((result, member) => {
        result[member.person] = member.role
        return result
      }, {})
      pendingInvites = invites
      entitlement = currentEntitlement
    } finally {
      loading = false
    }
  }

  onMount(load)

  query.query(contact.mixin.Employee, { active: true }, (result) => {
    employees = result
      .filter((employee) => employee.personUuid != null)
      .sort((a, b) => formatName(a.name).localeCompare(formatName(b.name)))
  })

  async function change (personUuid: string, value: AccountRole): Promise<void> {
    await accountClient.updateWorkspaceRole(personUuid, value)
    workspaceMembers[personUuid] = value
    workspaceMembers = workspaceMembers
    const employee = employees.find((item) => item.personUuid === personUuid)
    if (employee !== undefined) {
      await client.update(employee, { role: guestRoles.includes(value) ? 'GUEST' : 'USER' })
    }
    await load()
  }

  function remove (employee: Employee): void {
    showPopup(MessageBox, {
      label: setting.string.RemoveMember,
      message: setting.string.RemoveMemberDescription,
      dangerous: true,
      action: async () => {
        if (employee.personUuid == null) return
        const leaveWorkspace = await getResource(login.function.LeaveWorkspace)
        await leaveWorkspace(employee.personUuid)
        await client.update(employee, { active: false })
        await load()
      }
    })
  }

  async function cancelInvite (id: string): Promise<void> {
    await accountClient.cancelInvite(id)
    await load()
  }

  async function resendInvite (email: string, role: AccountRole): Promise<void> {
    failedInviteEmail = undefined
    try {
      await accountClient.resendInvite(email, role)
      await load()
    } catch {
      failedInviteEmail = email
    }
  }

  function openBilling (): void {
    const location = getCurrentResolvedLocation()
    location.path[3] = 'setting'
    location.path[4] = 'billing'
    location.path[5] = 'subscriptions'
    location.path.length = 6
    navigate(location)
  }

  function getItems (role: AccountRole, account: Account): DropdownIntlItem[] {
    return items.filter((item) => item.id === role || hasAccountRole(account, item.id as AccountRole))
  }

  $: ownersCount = Object.values(workspaceMembers).filter((role) => role === AccountRole.Owner).length
  $: usedSeats = (entitlement?.memberSeats ?? 0) + (entitlement?.pendingInviteSeats ?? 0)
  $: availableSeats = entitlement?.availableSeats
  $: hasAvailableSeat = entitlement?.plan !== 'business' || (availableSeats ?? 0) > 0
  $: normalizedSearch = search.trim().toLocaleLowerCase()
</script>

<div class="teronComponent">
  <Header adaptive="disabled">
    <Breadcrumb icon={setting.icon.Members} label={setting.string.Members} size="large" isCurrent />
    <Button
      label={setting.string.InviteMember}
      kind="primary"
      disabled={!hasAvailableSeat}
      on:click={() => showPopup(InviteMemberPopup, {}, undefined, () => void load())}
    />
    <svelte:fragment slot="search"><SearchInput bind:value={search} collapsed /></svelte:fragment>
  </Header>
  <div class="teronComponent-content__column content">
    {#if loading}
      <div class="w-full h-full flex-col-center justify-center"><Loading /></div>
    {:else}
      <Scroller align="center" padding="var(--spacing-3)" bottomPadding="var(--spacing-3)">
        <div class="teronComponent-content flex-col flex-gap-4">
          {#if entitlement?.seatLimit !== undefined}
            <div class="seat-summary">
              <div><strong>{entitlement.seatLimit}</strong><Label label={setting.string.ContractedSeats} /></div>
              <div><strong>{usedSeats}</strong><Label label={setting.string.OccupiedSeats} /></div>
              <div><strong>{availableSeats ?? 0}</strong><Label label={setting.string.AvailableSeats} /></div>
            </div>
            {#if !hasAvailableSeat}
              <div class="seat-alert flex-row-center flex-gap-3">
                <div class="flex-grow"><Label label={setting.string.SeatLimitOwnerOnly} /></div>
                {#if currentAccount.role === AccountRole.Owner}
                  <Button label={setting.string.ManageBilling} kind="secondary" on:click={openBilling} />
                {/if}
              </div>
            {/if}
          {/if}

          <div class="section-title"><Label label={setting.string.ActiveMembers} /></div>
          {#each employees as employee (employee._id)}
            {@const personUuid = employee.personUuid ?? undefined}
            {@const role = personUuid !== undefined ? workspaceMembers[personUuid] : undefined}
            {#if personUuid !== undefined && role !== undefined && formatName(employee.name).toLocaleLowerCase().includes(normalizedSearch)}
              <div class="member-row" data-id="owners-member-row">
                <div class="flex-grow min-w-80"><EmployeePresenter value={employee} disabled={false} /></div>
                <DropdownLabelsIntl
                  label={setting.string.Role}
                  disabled={!hasAccountRole(currentAccount, role) || (role === AccountRole.Owner && ownersCount === 1) || currentAccount.uuid === personUuid}
                  kind="primary"
                  size="medium"
                  items={getItems(role, currentAccount)}
                  selected={role}
                  on:selected={(event) => void change(personUuid, event.detail)}
                />
                {#if currentAccount.uuid !== personUuid && hasAccountRole(currentAccount, role)}
                  <Button label={setting.string.RemoveMember} kind="secondary" on:click={() => remove(employee)} />
                {/if}
              </div>
            {/if}
          {/each}

          <div class="section-title mt-4"><Label label={setting.string.PendingInvites} /></div>
          {#if pendingInvites.length === 0}
            <div class="text-secondary"><Label label={setting.string.NoPendingInvites} /></div>
          {:else}
            {#each pendingInvites as invite (invite.id)}
              <div class="member-row">
                <div class="flex-grow">
                  <div>{invite.email}</div>
                  <div class="text-sm text-secondary"><Label label={setting.string.InviteExpires} params={{ date: new Date(invite.expiresOn).toLocaleDateString() }} /></div>
                </div>
                <Label label={items.find((item) => item.id === invite.role)?.label ?? setting.string.User} />
                <Button label={setting.string.ResendInvite} kind="secondary" on:click={() => void resendInvite(invite.email, invite.role)} />
                <Button label={setting.string.CancelInvite} kind="secondary" on:click={() => void cancelInvite(invite.id)} />
                {#if failedInviteEmail === invite.email}
                  <div class="error-color text-sm"><Label label={setting.string.InviteMemberFailed} /></div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      </Scroller>
    {/if}
  </div>
</div>

<style lang="scss">
  .seat-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--spacing-2); }
  .seat-summary > div { display: flex; flex-direction: column; gap: var(--spacing-1); padding: var(--spacing-3); border: 1px solid var(--theme-divider-color); border-radius: var(--medium-BorderRadius); }
  .seat-summary strong { font-size: 1.5rem; }
  .seat-alert { padding: var(--spacing-2); border: 1px solid var(--theme-state-negative-border-color); border-radius: var(--medium-BorderRadius); background: var(--theme-state-negative-background-color); }
  .section-title { font-size: 1rem; font-weight: 500; }
  .member-row { display: flex; align-items: center; gap: var(--spacing-2); padding: var(--spacing-2); border-bottom: 1px solid var(--theme-divider-color); }
</style>
