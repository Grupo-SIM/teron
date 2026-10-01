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

  import { CalendarMode } from '../index'
  import CalendarFilter from './CalendarFilter.svelte'
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
</script>

<div class="calendar-header">
  <div class="title">
    {monthName}
    <span>{currentDate.getFullYear()}</span>
  </div>
  <div class="calendar-controls">
    <CalendarFilter {calendars} bind:selectedCalendar />
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
