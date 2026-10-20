<script lang="ts">
  import { afterUpdate, onDestroy, createEventDispatcher } from 'svelte'
  import { visibleCalendarStore } from '@hcengineering/calendar-resources'
  import contact, { Person, SocialIdentity } from '@hcengineering/contact'
  import { AssigneeBox } from '@hcengineering/contact-resources'
  import { Ref, getCurrentAccount } from '@hcengineering/core'
  import { createQuery } from '@hcengineering/presentation'
  import { Separator, defineSeparators, deviceOptionsStore as deviceInfo } from '@hcengineering/ui'
  import { AgendaMode, migrateAgendaMode, selectAgendaCalendars } from '../agenda'
  import { timeSeparators } from '../utils'
  import PlanningCalendar from './PlanningCalendar.svelte'
  import ToDosNavigator from './ToDosNavigator.svelte'

  const dispatch = createEventDispatcher()
  const account = getCurrentAccount()
  const peopleQuery = createQuery()
  let person: Ref<Person> | null | undefined
  let identities: SocialIdentity[] = []
  let mainPanel: HTMLElement
  let currentDate = new Date()
  let mode: AgendaMode = migrateAgendaMode(localStorage.getItem('todos_last_mode'))
  localStorage.setItem('todos_last_mode', mode)
  localStorage.removeItem('todos_last_tag')

  $: peopleQuery.query(contact.class.SocialIdentity, { attachedTo: person ?? { $in: [] } }, (result) => {
    identities = result
  })
  $: calendars = selectAgendaCalendars($visibleCalendarStore, mode, account.socialIds,
    person == null ? undefined : identities.filter((identity) => identity.attachedTo === person).map((identity) => identity._id))
  $: calendarIds = calendars.map((item) => item._id)

  defineSeparators('time', timeSeparators)
  dispatch('change', true)
  afterUpdate(() => { $deviceInfo.replacedPanel = mainPanel })
  onDestroy(() => { $deviceInfo.replacedPanel = undefined })
</script>

{#if $deviceInfo.navigator.visible}
  <ToDosNavigator bind:mode bind:currentDate />
  <Separator name="time" float={$deviceInfo.navigator.float} index={0} color="var(--theme-divider-color)" />
{/if}
<div class="flex-col w-full clear-mins mobile-wrapper" bind:this={mainPanel}>
  <PlanningCalendar bind:currentDate displayedDaysCount={5} {calendarIds}>
    <svelte:fragment slot="actions">
      {#if mode === 'team'}
        <AssigneeBox label={contact.string.Employee} bind:value={person} kind="secondary" />
      {/if}
    </svelte:fragment>
  </PlanningCalendar>
</div>
