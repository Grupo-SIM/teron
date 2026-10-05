<script lang="ts">
  import view from '@hcengineering/view'
  import calendar, { Event } from '@hcengineering/calendar'
  import { calendarByIdStore, isReadOnly, isVisible } from '@hcengineering/calendar-resources'
  import { Button, Label, getUserTimezone, showPopup, themeStore } from '@hcengineering/ui'

  export let event: Event
  export let from: number
  export let to: number
  $: visible = isVisible(event, $calendarByIdStore)
  $: time = new Intl.DateTimeFormat($themeStore.language, { hour: '2-digit', minute: '2-digit', timeZone: getUserTimezone() })
</script>

<div class="agenda-event flex-row-center gap-2">
  <div class="flex-col flex-no-shrink">
    {#if event.allDay}
      <Label label={calendar.string.AllDay} />
    {:else}
      <span>{time.format(Math.max(from, event.date))} – {time.format(Math.min(to, event.dueDate))}</span>
    {/if}
  </div>
  {#if visible}
    <span class="overflow-label flex-grow">{event.title}</span>
    {#if !isReadOnly(event)}
      <Button label={view.string.Edit} kind="secondary" on:click={() => showPopup(calendar.component.EditEvent, { object: event }, 'top')} />
    {/if}
  {:else}
    <span class="overflow-label"><Label label={calendar.string.Busy} /></span>
  {/if}
</div>

<style lang="scss">
  .agenda-event {
    padding: var(--spacing-1) var(--spacing-2);
    border-bottom: 1px solid var(--theme-divider-color);
  }
</style>
