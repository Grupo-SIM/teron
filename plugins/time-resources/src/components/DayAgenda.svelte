<script lang="ts">
  import calendar, { Calendar, Event, getAllEvents } from '@hcengineering/calendar'
  import { Ref, SortingOrder } from '@hcengineering/core'
  import { createQuery } from '@hcengineering/presentation'
  import { Scroller } from '@hcengineering/ui'
  import { agendaDayRange } from '../agenda'
  import Header from './Header.svelte'
  import AgendaEvent from './AgendaEvent.svelte'

  export let currentDate: Date
  export let calendarIds: Ref<Calendar>[] = []
  const query = createQuery()
  let raw: Event[] = []
  let loaded = false
  $: range = agendaDayRange(currentDate)
  $: {
    raw = []
    loaded = false
    query.query(calendar.class.Event, { calendar: { $in: calendarIds } }, (result) => {
      raw = result
      loaded = true
    }, { sort: { date: SortingOrder.Ascending } })
  }
  $: events = getAllEvents(raw, range.from, range.to, false).filter((event) => event.date < range.to && event.dueDate > range.from)
</script>

<Header bind:currentDate />
<Scroller>
  {#if !loaded}
    {#each [0, 1, 2] as row}
      <div class="agenda-skeleton" aria-hidden="true" />
    {/each}
  {:else}
    {#each events as event}
      <AgendaEvent {event} from={range.from} to={range.to} />
    {/each}
  {/if}
</Scroller>

<style lang="scss">
  .agenda-skeleton {
    height: 3rem;
    margin: var(--spacing-1) var(--spacing-2);
    border-radius: var(--small-BorderRadius);
    background: var(--theme-button-default);
  }
</style>
