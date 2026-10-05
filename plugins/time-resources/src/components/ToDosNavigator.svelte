<script lang="ts">
  import { ScheduleNavSection } from '@hcengineering/calendar-resources'
  import { NavFooter } from '@hcengineering/workbench-resources'
  import { Month, NavItem, Label, Scroller, deviceOptionsStore as deviceInfo } from '@hcengineering/ui'
  import { AgendaMode } from '../agenda'
  import time from '../plugin'

  export let mode: AgendaMode
  export let currentDate: Date

  function choose (value: string): void {
    mode = value === 'team' ? 'team' : 'mine'
    localStorage.setItem('todos_last_mode', mode)
  }
</script>

<div class="antiPanel-navigator {$deviceInfo.navigator.direction === 'horizontal' ? 'portrait' : 'landscape'} border-left" class:fly={$deviceInfo.navigator.float}>
  <div class="antiPanel-wrap__content teronNavPanel-container">
    <div class="teronNavPanel-header"><Label label={time.string.Planner} /></div>
    <Scroller shrink>
      {#each [{ value: 'mine', label: time.string.MyCalendars, icon: time.icon.Planned }, { value: 'team', label: time.string.TeamCalendars, icon: time.icon.All }] as item}
        <NavItem icon={item.icon} label={item.label} selected={mode === item.value} on:click={() => choose(item.value)} />      {/each}
      <Month {currentDate} on:update={(event) => { if (event.detail) currentDate = event.detail }} />
      <ScheduleNavSection />
    </Scroller>
    <NavFooter />
  </div>
</div>
