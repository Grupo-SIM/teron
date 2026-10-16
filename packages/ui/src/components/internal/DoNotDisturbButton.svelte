<script lang="ts">
  import { translate } from '@hcengineering/platform'
  import { themeStore } from '@hcengineering/theme'
  import { doNotDisturb } from '../../do-not-disturb'
  import ui from '../../plugin'
  import { tooltip } from '../../tooltips'
  import { addNotification } from '../../utils'
  import NotificationToast from '../NotificationToast.svelte'
  import { NotificationSeverity } from '../notifications/NotificationSeverity'

  let label = ''
  $: void translate($doNotDisturb ? ui.string.DisableDoNotDisturb : ui.string.EnableDoNotDisturb,
    {}, $themeStore.language).then((value) => { label = value })

  async function toggle (): Promise<void> {
    const enabled = !$doNotDisturb
    doNotDisturb.set(enabled)
    const message = await translate(enabled ? ui.string.DoNotDisturbEnabled : ui.string.DoNotDisturbDisabled,
      {}, $themeStore.language)
    addNotification(message, '', NotificationToast, { title: message, severity: NotificationSeverity.Info }, NotificationSeverity.Info)
  }
</script>

<button
  class="antiButton jf-center no-focus statusButton square"
  class:pressed={$doNotDisturb}
  style:border={'1px solid var(--theme-divider-color)'}
  style:cursor={'pointer'}
  class:active={$doNotDisturb}
  use:tooltip={{ label: $doNotDisturb ? ui.string.DisableDoNotDisturb : ui.string.EnableDoNotDisturb, direction: 'bottom' }}
  aria-label={label}
  aria-pressed={$doNotDisturb}
  on:click={toggle}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M7 12h10" />
  </svg>
</button>

<style>
  .statusButton.active {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.14);
    border-color: #ef4444 !important;
  }
</style>
