<!--
// Copyright © 2023 Hardcore Engineering Inc.
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
  import { RecurringRule } from '@hcengineering/calendar'
  import {
    Button,
    Icon
  } from '@hcengineering/ui'
  import { createEventDispatcher } from 'svelte'
  import calendar from '../plugin'
  import RRulePresenter from './RRulePresenter.svelte'
  import TimeZoneSelector from './TimeZoneSelector.svelte'

  export let allDay: boolean
  export let rules: RecurringRule[] = []
  export let noRepeat: boolean = false
  export let timeZone: string
  export let readOnly: boolean = false

  const dispatch = createEventDispatcher()
</script>

<div class="flex-row-center gap-1 mt-1">
  <Button
    label={calendar.string.AllDay}
    kind={allDay ? 'primary' : 'secondary'}
    disabled={readOnly}
    on:click={() => {
      allDay = !allDay
      dispatch('allday')
    }}
  />
  <TimeZoneSelector bind:timeZone disabled={readOnly} />
  {#if !noRepeat}
    <Button
      label={rules.length > 0 ? undefined : calendar.string.Repeat}
      kind={rules.length > 0 ? 'primary' : 'secondary'}
      disabled={readOnly}
      on:click={() => dispatch('repeat')}
    >
      <svelte:fragment slot="content">
        {#if rules.length > 0}
          <Icon icon={calendar.icon.Repeat} size={'small'} />
          <RRulePresenter {rules} />
        {/if}
      </svelte:fragment>
    </Button>
  {/if}
</div>
