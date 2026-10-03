<script lang="ts">
  import { afterUpdate, onDestroy, createEventDispatcher } from 'svelte'
  import { CalendarFilter, visibleCalendarStore } from '@hcengineering/calendar-resources'
  import contact, { Person, SocialIdentity } from '@hcengineering/contact'
  import { AssigneeBox } from '@hcengineering/contact-resources'
  import { Ref, getCurrentAccount } from '@hcengineering/core'
  import { createQuery } from '@hcengineering/presentation'
  import { Separator, defineSeparators, deviceOptionsStore as deviceInfo } from '@hcengineering/ui'
  import { AgendaMode, migrateAgendaMode, selectAgendaCalendars } from '../agenda'
  import { timeSeparators } from '../utils'
  import DayAgenda from './DayAgenda.svelte'
  import PlanningCalendar from './PlanningCalendar.svelte'
  import ToDosNavigator from './ToDosNavigator.svelte'

  const dispatch = createEventDispatcher()
  const account = getCurrentAccount()
  const peopleQuery = createQuery()
  let person: Ref<Person> | null | undefined
  let identities: SocialIdentity[] = []
  let mainPanel: HTMLElement
  let replacedPanel: HTMLElement | undefined
  let currentDate = new Date()
  let mode: AgendaMode = migrateAgendaMode(localStorage.getItem('todos_last_mode'))
  let selectedCalendar = 'all'
  localStorage.setItem('todos_last_mode', mode)
  localStorage.removeItem('todos_last_tag')

  $: peopleQuery.query(contact.class.SocialIdentity, { attachedTo: person ?? { $in: [] } }, (result) => {
    identities = result
  })
  $: calendars = selectAgendaCalendars($visibleCalendarStore, mode, account.socialIds,
    person == null ? undefined : identities.filter((identity) => identity.attachedTo === person).map((identity) => identity._id))
  $: if (selectedCalendar !== 'all' && !calendars.some((item) => item._id === selectedCalendar)) selectedCalendar = 'all'
  $: calendarIds = calendars.filter((item) => selectedCalendar === 'all' || item._id === selectedCalendar).map((item) => item._id)
  $: visibleCalendar = $deviceInfo.docWidth > 800

  defineSeparators('time', timeSeparators)
  dispatch('change', true)
  afterUpdate(() => { $deviceInfo.replacedPanel = replacedPanel ?? mainPanel })
  onDestroy(() => { $deviceInfo.replacedPanel = undefined })
</script>

{#if $deviceInfo.navigator.visible}
  <ToDosNavigator bind:mode bind:currentDate />
  <Separator name="time" float={$deviceInfo.navigator.float} index={0} color="var(--theme-divider-color)" />
{/if}
<div class="flex-col w-full clear-mins mobile-wrapper" bind:this={mainPanel}>
  <div class="flex-row-center gap-2 p-2">
    {#if mode === 'team'}
      <AssigneeBox label={contact.string.Employee} bind:value={person} kind="secondary" />
    {/if}
    <CalendarFilter {calendars} bind:selectedCalendar />
  </div>
  <DayAgenda bind:currentDate {calendarIds} />
</div>
{#if visibleCalendar}
  <Separator name="time" index={1} color="transparent" separatorSize={0} short />
  <PlanningCalendar bind:element={replacedPanel} bind:currentDate displayedDaysCount={5} {calendarIds} />
{/if}
