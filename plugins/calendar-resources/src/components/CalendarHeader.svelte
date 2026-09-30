<!--
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
-->
<script lang="ts">
  import { IntlString } from '@hcengineering/platform'
  import type { Calendar } from '@hcengineering/calendar'
  import { Button, SelectPopup, showPopup } from '@hcengineering/ui'

  import { CalendarMode } from '../index'
  import calendar from '../plugin'
  import CalendarNavigation from './CalendarNavigation.svelte'

  export let currentDate: Date
  export let monthName: string
  export let ddItems: {
    id: string | number
    label: IntlString
    mode: CalendarMode
    params?: Record<string, any>
  }[] = []
  export let mode: CalendarMode
  export let onToday: () => void
  export let onBack: () => void
  export let onForward: () => void
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

<div class="calendar-header">
  <div class="title">
    {monthName}
    <span>{currentDate.getFullYear()}</span>
  </div>
  <div class="calendar-controls">
    <Button
      label={calendar.string.Calendars}
      kind="secondary"
      on:click={chooseCalendar}
    >
      <svelte:fragment slot="content">
        {#if selectedCalendar !== 'all'}
          <span class="ml-2">{calendars.find((item) => item._id === selectedCalendar)?.name}</span>
        {/if}
      </svelte:fragment>
    </Button>
    <CalendarNavigation {ddItems} bind:mode {onToday} {onBack} {onForward} />
  </div>
</div>

<style lang="scss">
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    padding: 0.75rem 1.75rem 0.75rem 2.25rem;
    min-width: 0;
    min-height: 0;

    .title {
      font-size: 1.25rem;
      color: var(--theme-caption-color);

      &::first-letter {
        text-transform: uppercase;
      }
      span {
        opacity: 0.4;
      }
    }
  }

  .calendar-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
</style>
