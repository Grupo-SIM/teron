<script lang="ts">
  import { translate } from '@hcengineering/platform'
  import { themeStore } from '@hcengineering/theme'
  import { anonymousMode } from '../../anonymous-mode'
  import ui from '../../plugin'
  import { tooltip } from '../../tooltips'
  import { addNotification } from '../../utils'
  import NotificationToast from '../NotificationToast.svelte'
  import { NotificationSeverity } from '../notifications/NotificationSeverity'

  let label = ''
  $: void translate($anonymousMode ? ui.string.DisableAnonymousMode : ui.string.EnableAnonymousMode,
    {}, $themeStore.language).then((value) => { label = value })

  async function toggle (): Promise<void> {
    const enabled = !$anonymousMode
    anonymousMode.set(enabled)
    const message = await translate(enabled ? ui.string.AnonymousModeEnabled : ui.string.AnonymousModeDisabled,
      {}, $themeStore.language)
    addNotification(message, '', NotificationToast, { title: message, severity: NotificationSeverity.Info }, NotificationSeverity.Info)
  }
</script>

<button
  class="antiButton jf-center no-focus statusButton square"
  class:pressed={$anonymousMode}
  style:border={'1px solid var(--theme-divider-color)'}
  style:cursor={'pointer'}
  class:active={$anonymousMode}
  use:tooltip={{ label: $anonymousMode ? ui.string.DisableAnonymousMode : ui.string.EnableAnonymousMode, direction: 'bottom' }}
  aria-label={label}
  aria-pressed={$anonymousMode}
  on:click={toggle}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A11 11 0 0 1 12 5c5 0 9 7 9 7a19 19 0 0 1-3.1 3.9M6.2 6.2C4.2 7.7 3 10 3 12c0 0 4 7 9 7a10 10 0 0 0 4.1-.9" />
  </svg>
</button>

<style>
  .statusButton.active {
    color: #a78bfa;
    background: rgba(167, 139, 250, 0.14);
    border-color: #a78bfa !important;
  }
</style>
