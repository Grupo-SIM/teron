<!--
// Copyright © 2025 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
-->
<script lang="ts">
  import {
    type SubscriptionData,
    SubscriptionType,
    type WorkspaceEntitlement
  } from '@hcengineering/account-client'
  import { type CheckoutStatus } from '@hcengineering/payment-client'
  import { Tier } from '@hcengineering/billing'
  import { translate } from '@hcengineering/platform'
  import { getClient, MessageBox } from '@hcengineering/presentation'
  import { generateId, type Ref, SortingOrder, UsageStatus } from '@hcengineering/core'
  import {
    Label,
    Loading,
    Scroller,
    Button,
    themeStore,
    getLocation,
    navigate,
    showPopup,
    addNotification,
    NotificationSeverity,
    EditBox
  } from '@hcengineering/ui'
  import { onMount, onDestroy } from 'svelte'

  import plugin from '../plugin'
  import { getAccountClient, getPaymentClient } from '../utils'

  import UsageSection from './UsageSection.svelte'
  import BillingErrorNotification from './BillingErrorNotification.svelte'

  const client = getClient()
  const paymentClient = getPaymentClient()

  const tiers = client.getModel().findAllSync(plugin.class.Tier, {}, { sort: { index: SortingOrder.Ascending } })
  const tierByPlan = tiers.reduce<Record<string, Tier>>((acc, tier) => {
    const { plan } = getTypeAndPlan(tier._id)
    acc[plan] = tier
    return acc
  }, {})

  export let isReadOnly: boolean = false

  let currentSubscription: SubscriptionData | undefined = undefined
  let entitlement: WorkspaceEntitlement | undefined
  $: currentTier = currentSubscription != null ? tierByPlan[currentSubscription.plan] : undefined
  let loading = true
  let pollingCheckoutId: string | null = null
  let isPolling = false
  let pollAttempts = 0
  let pollTimer: number | undefined
  let isCanceling = false
  let isUncanceling = false
  const MAX_POLL_ATTEMPTS = 120
  const POLL_INTERVAL = 2000

  let usageInfo: UsageStatus | null = null
  let seatQuote: Awaited<ReturnType<NonNullable<ReturnType<typeof getAccountClient>>['getWorkspaceSeatQuote']>> | undefined
  let targetSeatLimit: number | undefined
  let seatChangeStatus: string | undefined
  let changingSeats = false

  $: isCurrentCanceled = currentSubscription?.canceledAt !== undefined && currentSubscription.canceledAt > 0
  $: canManageProviderSubscription = currentSubscription?.provider !== 'internal'

  async function showErrorNotification (): Promise<void> {
    addNotification(
      await translate(plugin.string.SubscriptionOperationFailed, {}, $themeStore.language),
      await translate(plugin.string.SubscriptionErrorMessage, {}, $themeStore.language),
      BillingErrorNotification,
      undefined,
      NotificationSeverity.Error
    )
  }

  async function handleCancel (): Promise<void> {
    if (currentSubscription?.id === undefined) {
      return
    }

    if (isCurrentCanceled) {
      return
    }

    showPopup(MessageBox, {
      label: plugin.string.ConfirmCancel,
      dangerous: true,
      message: plugin.string.CancelDescription,
      action: async () => {
        await executeCancel()
      }
    })
  }

  async function executeCancel (): Promise<void> {
    if (paymentClient == null) {
      return
    }
    if (currentSubscription?.id === undefined) {
      return
    }

    try {
      isCanceling = true
      currentSubscription = await paymentClient.cancelSubscription(currentSubscription.id)
    } catch (error) {
      console.error('Error canceling subscription:', error)
      await showErrorNotification()
    } finally {
      isCanceling = false
    }
  }

  async function handleUncancel (): Promise<void> {
    if (currentSubscription?.id === undefined) {
      return
    }

    if (!isCurrentCanceled) {
      return
    }

    showPopup(MessageBox, {
      label: plugin.string.ConfirmUncancel,
      message: plugin.string.UncancelDescription,
      action: async () => {
        await executeUncancel()
      }
    })
  }

  async function executeUncancel (): Promise<void> {
    if (paymentClient == null) {
      return
    }
    if (currentSubscription?.id === undefined) {
      return
    }
    if (!isCurrentCanceled) {
      return
    }

    try {
      isUncanceling = true
      currentSubscription = await paymentClient.uncancelSubscription(currentSubscription.id)
    } catch (error) {
      console.error('Error uncanceling subscription:', error)
      await showErrorNotification()
    } finally {
      isUncanceling = false
    }
  }

  async function fetchSubscriptions (): Promise<void> {
    loading = true

    try {
      const accountClient = getAccountClient()
      if (accountClient == null) return

      const [subscriptions, currentEntitlement] = await Promise.all([
        accountClient.getSubscriptions(undefined, false),
        accountClient.getWorkspaceEntitlement()
      ])
      entitlement = currentEntitlement
      currentSubscription = subscriptions
        .filter((p) => p.type === 'tier')
        .sort(
          (a, b) => Number(b.plan === 'unlimited') - Number(a.plan === 'unlimited') || b.updatedOn - a.updatedOn
        )[0]
      const plan = currentSubscription?.plan
      currentTier = plan !== undefined ? tierByPlan[plan] : undefined
      if (currentEntitlement.plan === 'business' && currentEntitlement.seatLimit !== undefined) {
        targetSeatLimit = currentEntitlement.nextSeatLimit ?? currentEntitlement.seatLimit
        seatQuote = await accountClient.getWorkspaceSeatQuote(currentEntitlement.seatLimit)
      }
    } catch (err) {
      console.error('Error fetching current plan:', err)
      await showErrorNotification()
    } finally {
      loading = false
    }
  }

  async function previewSeatChange (): Promise<void> {
    const accountClient = getAccountClient()
    if (accountClient == null || targetSeatLimit == null) return
    seatQuote = await accountClient.getWorkspaceSeatQuote(targetSeatLimit)
  }

  async function applySeatChange (): Promise<void> {
    const accountClient = getAccountClient()
    if (accountClient == null || targetSeatLimit == null) return
    changingSeats = true
    try {
      const operationId = generateId()
      let result = await accountClient.changeWorkspaceSeatLimit(targetSeatLimit, operationId)
      seatChangeStatus = result.status
      while (['PENDING_PAYMENT', 'PENDING_RECURRENCE_UPDATE'].includes(result.status)) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const refreshed = await accountClient.getWorkspaceSeatChange(operationId)
        if (refreshed == null) break
        result = refreshed
        seatChangeStatus = result.status
      }
      await fetchSubscriptions()
    } catch (err) {
      seatChangeStatus = 'FAILED'
      await showErrorNotification()
    } finally {
      changingSeats = false
    }
  }

  function confirmSeatChange (): void {
    showPopup(MessageBox, {
      label: plugin.string.ConfirmSeatChange,
      message: plugin.string.ConfirmSeatChangeDescription,
      action: async () => await applySeatChange()
    })
  }

  async function fetchUsageStats (): Promise<void> {
    try {
      const accountClient = getAccountClient()
      if (accountClient == null) return

      const workspaceInfo = await accountClient.getWorkspaceInfo(false)
      usageInfo = workspaceInfo.usageInfo ?? null
    } catch (err) {
      console.error('Error fetching usage stats:', err)
      await showErrorNotification()
      usageInfo = null
    }
  }

  async function pollCheckoutStatus (checkoutId: string): Promise<void> {
    if (paymentClient == null) {
      return
    }
    if (isPolling || pollAttempts >= MAX_POLL_ATTEMPTS) {
      return
    }

    isPolling = true
    pollAttempts++

    try {
      const status: CheckoutStatus = await paymentClient.getCheckoutStatus(checkoutId)

      if (status.status === 'completed') {
        // Subscription is ready, refresh subscriptions and clean up URL
        console.info('Checkout completed, subscription ready:', status.subscriptionId)
        await fetchSubscriptions()

        // Clean up the checkout_id from URL using navigate
        const loc = getLocation()
        const cleanedLoc = { ...loc, query: {} }
        navigate(cleanedLoc)

        pollingCheckoutId = null
        pollAttempts = 0
      } else {
        // Still pending, poll again after delay
        pollTimer = setTimeout(() => {
          void pollCheckoutStatus(checkoutId)
        }, POLL_INTERVAL)
      }
    } catch (err) {
      console.error('Error polling checkout status:', err)
      await showErrorNotification()
      // Retry on error (up to max attempts)
      if (pollAttempts < MAX_POLL_ATTEMPTS) {
        pollTimer = setTimeout(() => {
          void pollCheckoutStatus(checkoutId)
        }, POLL_INTERVAL)
      }
    } finally {
      isPolling = false
    }
  }

  function checkForCheckoutParam (): void {
    const loc = getLocation()
    const checkoutId = loc.query?.checkout_id as string | undefined
    const paymentStatus = loc.query?.payment as string | undefined

    if (checkoutId !== undefined && paymentStatus === 'success') {
      // Check if we already have a tier subscription that matches this checkout
      const isMatchingSubscription = currentSubscription?.providerCheckoutId === checkoutId

      if (!isMatchingSubscription) {
        // No matching subscription found, start polling
        pollingCheckoutId = checkoutId
        pollAttempts = 0
        void pollCheckoutStatus(checkoutId)
      } else {
        // Subscription already exists and matches this checkout, just clean up the URL
        const cleanedLoc = { ...loc, query: {} }
        navigate(cleanedLoc)
      }
    }
  }

  $: isCheckoutPolling = pollingCheckoutId !== null

  function formatEndDate (endDate: number): string {
    const date = new Date(endDate)
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  }

  function getTypeAndPlan (tierId: Ref<Tier>): { type: SubscriptionType, plan: string } {
    const parts = tierId.split(':')
    if (parts.length !== 3) {
      throw new Error(`Invalid tier id: ${tierId}`)
    }

    return {
      type: parts[1] as SubscriptionType,
      plan: parts[2].toLowerCase()
    }
  }

  onMount(() => {
    void (async () => {
      // First, load current subscriptions
      await fetchSubscriptions()

      // Then fetch usage stats
      await fetchUsageStats()

      // Then check if we need to poll for a new subscription from checkout
      checkForCheckoutParam()
    })()
  })

  onDestroy(() => {
    // Clean up any pending polling timer when component is destroyed
    if (pollTimer !== undefined) {
      clearTimeout(pollTimer)
    }
  })
</script>

{#if tiers.length > 0}
  <Scroller align={'center'} padding={'var(--spacing-3)'} bottomPadding={'var(--spacing-3)'}>
    <div class="teronComponent-content gapV-8">
      <div class="flex-col flex-gap-4">
        <div class="section-title">
          <Label label={plugin.string.ActivePlan} />
        </div>
        <div class="current-tier-card w-full flex-gap-4">
          {#if loading || isCheckoutPolling}
            <Loading />
            {#if isCheckoutPolling}
              <div class="processing"><Label label={plugin.string.ProcessingPayment} /></div>
            {/if}
          {:else if currentTier === undefined}
            <div class="no-plan-container flex-col flex-gap-4">
              <div class="fs-title text-lg"><Label label={plugin.string.NoActivePlan} /></div>
              <div class="text-md"><Label label={plugin.string.SelectPlanToBegin} /></div>

              {#if usageInfo !== null}
                <div class="usage-section">
                  <UsageSection usage={usageInfo} tier={currentTier} />
                </div>
              {/if}
            </div>
          {:else}
            <div class="current-tier-card-title">
              <div class="flex-row-center">
                <div class="fs-title"><Label label={currentTier.label} /></div>
                {#if currentSubscription?.status === 'active'}
                  <div class="status-badge ml-2 text-md"><Label label={plugin.string.Active} /></div>
                {/if}
              </div>
              {#if entitlement?.plan === 'business' && seatQuote != null}
                <div class="flex-row-center items-end">
                  <span class="fs-title text-xl">
                    {Number(seatQuote.nextRecurringAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span class="ml-1 lower">
                    <Label label={plugin.string.Monthly} />
                  </span>
                </div>
              {:else if currentSubscription?.amount}
                <div class="flex-row-center items-end">
                  <span class="fs-title text-xl">
                    ${currentSubscription?.amount / 100}
                  </span>
                  <span class="ml-1 lower">
                    <Label label={plugin.string.Monthly} />
                  </span>
                </div>
              {/if}
            </div>

            {#if entitlement?.accessMode === 'read-only'}
              <div class="status-badge"><Label label={plugin.string.ReadOnlyWorkspace} /></div>
            {/if}
            {#if entitlement?.seatLimit !== undefined}
              <div>
                <Label
                  label={plugin.string.SeatsUsage}
                  params={{
                    used: entitlement.memberSeats + entitlement.pendingInviteSeats,
                    limit: entitlement.seatLimit
                  }}
                />
              </div>
            {/if}
            {#if entitlement?.nextSeatLimit !== undefined}
              <div>
                <Label label={plugin.string.ScheduledSeatLimit} params={{ limit: entitlement.nextSeatLimit }} />
              </div>
            {/if}

            {#if usageInfo !== null}
              <div class="usage-section">
                <UsageSection usage={usageInfo} tier={currentTier} />
              </div>
            {/if}

            <div class="curr-tier-footer">
              {#if currentSubscription?.periodEnd}
                {@const date = formatEndDate(currentSubscription.periodEnd)}
                {#if entitlement?.plan === 'free'}
                  <div><Label label={plugin.string.TrialEnds} params={{ date }} /></div>
                {:else if isCurrentCanceled}
                  <div><Label label={plugin.string.SubscriptionValidUntil} params={{ date }} /></div>
                {:else}
                  <div><Label label={plugin.string.SubscriptionRenews} params={{ date }} /></div>
                {/if}
              {/if}

              {#if canManageProviderSubscription && !isCurrentCanceled}
                <Button
                  label={plugin.string.CancelSubscription}
                  kind="ghost"
                  disabled={loading || isCheckoutPolling || isCanceling}
                  on:click={() => {
                    void handleCancel()
                  }}
                />
              {:else if canManageProviderSubscription}
                <Button
                  label={plugin.string.UncancelSubscription}
                  kind="primary"
                  disabled={loading || isCheckoutPolling || isUncanceling}
                  on:click={() => {
                    void handleUncancel()
                  }}
                />
              {/if}
            </div>
          {/if}
        </div>
      </div>

      {#if entitlement?.plan === 'business' && entitlement.seatLimit !== undefined}
        <div class="flex-col flex-gap-4">
          <div class="section-title"><Label label={plugin.string.SeatManagement} /></div>
          <div class="current-tier-card w-full flex-gap-4">
            <Label label={plugin.string.SeatManagementDescription} />
            <div class="seat-grid">
              <div><strong>{entitlement.seatLimit}</strong><Label label={plugin.string.ContractedSeats} /></div>
              <div><strong>{entitlement.memberSeats + entitlement.pendingInviteSeats}</strong><Label label={plugin.string.OccupiedSeats} /></div>
              <div><strong>{entitlement.availableSeats ?? 0}</strong><Label label={plugin.string.AvailableSeats} /></div>
              <div><strong>{entitlement.pendingInviteSeats}</strong><Label label={plugin.string.PendingInviteSeats} /></div>
            </div>

            {#if seatQuote != null}
              <div class="billing-values">
                <div><Label label={plugin.string.ProrationDueNow} /> <strong>{Number(seatQuote.estimatedProrationAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
                <div><Label label={plugin.string.NextRecurringAmount} /> <strong>{Number(seatQuote.nextRecurringAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
              </div>
            {/if}

            {#if entitlement.nextSeatLimit !== undefined}
              <div class="status-badge"><Label label={plugin.string.SeatReductionScheduled} params={{ limit: entitlement.nextSeatLimit }} /></div>
            {/if}
            {#if seatChangeStatus === 'PENDING_PAYMENT' || seatChangeStatus === 'PENDING_RECURRENCE_UPDATE'}
              <div><Label label={plugin.string.SeatChangePending} /></div>
            {:else if seatChangeStatus === 'FAILED' || seatChangeStatus === 'COMPENSATION_REQUIRED'}
              <div class="error-color"><Label label={plugin.string.SeatChangeFailed} /></div>
            {/if}

            <div class="flex-row-center flex-gap-2">
              <div class="max-w-40 flex-grow">
                <EditBox
                  format="number"
                  minValue={entitlement.memberSeats + entitlement.pendingInviteSeats}
                  maxDigitsAfterPoint={0}
                  bind:value={targetSeatLimit}
                />
              </div>
              <Button label={plugin.string.PreviewSeatChange} kind="secondary" disabled={changingSeats} on:click={() => void previewSeatChange()} />
              <Button
                label={plugin.string.ApplySeatChange}
                kind="primary"
                disabled={changingSeats || targetSeatLimit == null || targetSeatLimit === entitlement.seatLimit}
                on:click={confirmSeatChange}
              />
            </div>
            {#if targetSeatLimit != null && targetSeatLimit < entitlement.memberSeats + entitlement.pendingInviteSeats}
              <div class="error-color"><Label label={plugin.string.SeatReductionBlocked} /></div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </Scroller>
{/if}

<style lang="scss">
  .section-title {
    font-weight: 500;
    font-size: 1rem;
  }

  .current-tier-card {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    width: 31rem;
    border: 1px solid var(--theme-divider-color);
    border-radius: var(--medium-BorderRadius);
    padding: var(--spacing-2);
  }

  .current-tier-card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-badge {
    color: var(--theme-state-positive-color);
    background-color: var(--theme-state-positive-background-color);
    border-radius: var(--small-BorderRadius);
    padding: 0.125rem 0.5rem;
  }

  .tier-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-shrink: 0;
    width: 15rem;
    // max-height: 22rem;
    border: 1px solid var(--theme-divider-color);
    border-radius: var(--medium-BorderRadius);
    padding: var(--spacing-2);
    background-color: var(--theme-button-default);
  }

  .tier-card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    min-height: 0;
  }

  .tier-features {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .feature-item {
    display: flex;
    gap: var(--spacing-0_5);
    font-size: 0.8125rem;
  }

  .feature-bullet {
    color: var(--theme-state-positive-color);
    font-weight: 600;
    flex-shrink: 0;
  }

  .curr-tier-footer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--spacing-2);
    border-top: 1px solid var(--theme-divider-color);
  }

  .tier-card-footer {
    display: flex;
    flex-direction: row-reverse;
    margin-top: var(--spacing-3);
    height: 2.25rem;
  }

  .processing {
    text-align: center;
  }

  .seat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--spacing-2);
  }

  .seat-grid > div {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    padding: var(--spacing-2);
    border: 1px solid var(--theme-divider-color);
    border-radius: var(--small-BorderRadius);
  }

  .seat-grid strong {
    font-size: 1.25rem;
  }

  .billing-values {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-2);
  }

  .usage-section {
    padding-top: var(--spacing-2);
    border-top: 1px solid var(--theme-divider-color);
  }
</style>
