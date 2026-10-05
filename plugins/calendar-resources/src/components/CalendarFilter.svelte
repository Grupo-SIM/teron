<script lang="ts">
  import type { Calendar } from '@hcengineering/calendar'
  import { Button, SelectPopup, showPopup } from '@hcengineering/ui'
  import calendar from '../plugin'

  export let calendars: Calendar[] = []
  export let selectedCalendar = 'all'

  function chooseCalendar (event: MouseEvent): void {
    showPopup(
      SelectPopup,
      {
        value: [
          { id: 'all', label: calendar.string.Calendars, isSelected: selectedCalendar === 'all' },
          ...calendars.map((item) => ({
            id: item._id,
            text: item.name,
            isSelected: selectedCalendar === item._id
          }))
        ]
      },
      event.currentTarget as HTMLElement,
      (id) => {
        if (typeof id === 'string') selectedCalendar = id
      }
    )
  }
</script>

<Button label={calendar.string.Calendars} kind="secondary" on:click={chooseCalendar}>
  <svelte:fragment slot="content">
    {#if selectedCalendar !== 'all'}
      <span class="ml-2">{calendars.find((item) => item._id === selectedCalendar)?.name}</span>
    {/if}
  </svelte:fragment>
</Button>
