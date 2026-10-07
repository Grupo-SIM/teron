<!--
//
// Copyright © 2024 Hardcore Engineering Inc.
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
//
-->

<script lang="ts">
  import type { ComponentType } from 'svelte'
  import { fade } from 'svelte/transition'
  import Button from './Button.svelte'
  import Icon from './Icon.svelte'
  import CheckCircle from './icons/CheckCircle.svelte'
  import Close from './icons/Close.svelte'
  import Info from './icons/Info.svelte'
  import { NotificationSeverity } from './notifications/NotificationSeverity'
  import type { Notification } from './notifications/Notification'

  export let onClose: (() => void) | undefined = undefined
  export let severity: NotificationSeverity | undefined = undefined
  export let title: string = ''
  export let notification: Notification | undefined = undefined
  export let onRemove: (() => void) | undefined = undefined

  $: displayTitle = notification?.title ?? title
  $: displaySeverity = notification?.severity ?? severity
  $: closeHandler = onRemove ?? onClose

  const getIcon = (value: NotificationSeverity | undefined): ComponentType | undefined => {
    switch (value) {
      case NotificationSeverity.Success:
        return CheckCircle
      case NotificationSeverity.Error:
      case NotificationSeverity.Info:
      case NotificationSeverity.Warning:
        return Info
    }
  }

  $: icon = getIcon(displaySeverity)
</script>

<div class="notifyPopup" in:fade out:fade>
  <div class="flex-between">
    <div class="flex-row-center">
      {#if icon}
        <div
          class="mr-2"
          class:icon-success={displaySeverity === NotificationSeverity.Success}
          class:icon-error={displaySeverity === NotificationSeverity.Error}
          class:icon-info={displaySeverity === NotificationSeverity.Info}
          class:icon-warning={displaySeverity === NotificationSeverity.Warning}
        >
          <Icon {icon} size="medium" />
        </div>
      {/if}
      <span class="overflow-label fs-bold text-base caption-color">{displayTitle}</span>
    </div>
    {#if closeHandler !== undefined}
      <Button icon={Close} kind="ghost" size="small" dataId={'btnNotifyClose'} on:click={closeHandler} />
    {/if}
  </div>

  <div class="content">
    <slot name="content" />
  </div>

  {#if $$slots.buttons}
    <div class="flex-between gap-2">
      <slot name="buttons" />
    </div>
  {/if}
</div>

<style lang="scss">
  .notifyPopup {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin: 0.75rem;
    padding: 0.5rem;
    min-width: 25rem;
    max-width: 35rem;
    min-height: 7rem;
    color: var(--theme-caption-color);
    background-color: var(--theme-popup-color);
    border: 1px solid var(--theme-popup-divider);
    border-radius: 0.5rem;
    box-shadow: var(--theme-popup-shadow);

    .icon-success {
      color: var(--theme-won-color);
    }
    .icon-error {
      color: var(--theme-lost-color);
    }
    .icon-info {
      color: var(--primary-color-skyblue);
    }
    .icon-warning {
      color: var(--theme-warning-color);
    }

    .content {
      flex-grow: 1;
      margin: 1rem 0 1.25rem;
    }
  }
</style>
