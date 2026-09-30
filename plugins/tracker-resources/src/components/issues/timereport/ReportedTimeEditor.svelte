<!--
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021, 2023 Hardcore Engineering Inc.
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
  import type { IntlString } from '@hcengineering/platform'
  import { Issue, Project, currentChildReportedTime, currentReportedTime } from '@hcengineering/tracker'
  import { Label, floorFractionDigits } from '@hcengineering/ui'
  import { onMount } from 'svelte'
  import TimePresenter from './TimePresenter.svelte'

  // export let label: IntlString
  export let placeholder: IntlString
  export let object: Issue
  export let value: number
  export let kind: 'no-border' | 'link' = 'no-border'
  export let size: 'small' | 'medium' | 'large' = 'large'
  export let currentProject: Project | undefined
  export let readonly: boolean = false

  let now = Date.now()
  onMount(() => {
    const timer = setInterval(() => (now = Date.now()), 60000)
    return () => clearInterval(timer)
  })
  $: trackedHours = currentReportedTime({ ...object, reportedTime: value }, now)
  $: childTime = floorFractionDigits(
    currentChildReportedTime(object.childInfo, now),
    3
  )
</script>

{#if kind === 'link'}
  <div
    id="ReportedTimeEditor"
    class="link-container {size} flex-grow flex-between"
  >
    {#if trackedHours !== undefined}
      <span class="flex-row-center">
        <TimePresenter value={trackedHours} />
        {#if childTime !== 0}
          / <TimePresenter value={childTime} />
        {/if}
      </span>
    {:else}
      <span class="content-dark-color"><Label label={placeholder} /></span>
    {/if}
  </div>
{:else if trackedHours !== undefined}
  <span class="flex-row-center">
    <TimePresenter value={trackedHours} />
    {#if childTime !== 0}
      / <TimePresenter value={childTime} />
    {/if}
  </span>
{:else}
  <span class="content-dark-color"><Label label={placeholder} /></span>
{/if}

<style lang="scss">
  .link-container {
    padding: 0px 0.75rem;
    border-radius: 0.375rem;
  }
</style>
