<!--
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021 Hardcore Engineering Inc.
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
  import type { ButtonSize } from '@hcengineering/ui'
  import { Label, showPopup, eventToHTMLElement, Button } from '@hcengineering/ui'
  import TimeInputPopup from './TimeInputPopup.svelte'
  import TimeInput from './TimeInput.svelte'
  import TimePresenter from './TimePresenter.svelte'

  // export let label: IntlString
  export let unit: 'minutes' | 'hours' = 'minutes'
  export let placeholder: IntlString
  export let value: number | undefined
  export let autoFocus: boolean = false
  // export let maxWidth: string = '10rem'
  export let onChange: (value: number | undefined) => void
  export let kind: 'no-border' | 'link' | 'button' = 'no-border'
  export let readonly = false
  export let size: ButtonSize = 'small'
  export let justify: 'left' | 'center' = 'center'
  export let width: string | undefined = 'fit-content'

  let shown: boolean = false


</script>

{#if kind === 'button' || kind === 'link'}
  <Button
    kind={kind === 'button' ? 'regular' : kind}
    {size}
    {justify}
    {width}
    disabled={readonly}
    on:click={(ev) => {
      if (!shown && !readonly) {
        shown = true
        showPopup(TimeInputPopup, { value, unit }, eventToHTMLElement(ev), (res) => {
          if (Number.isFinite(res)) {
            value = res
            onChange(value)
          }
          shown = false
        })
      }
    }}
  >
    <svelte:fragment slot="content">
      {#if value != null}
        <span class="caption-color overflow-label pointer-events-none"><TimePresenter {value} /></span>
      {:else}
        <span class="content-dark-color pointer-events-none"><Label label={placeholder} /></span>
      {/if}
    </svelte:fragment>
  </Button>
{:else if readonly}
  {#if value != null}
    <span class="caption-color overflow-label"><TimePresenter {value} /></span>
  {:else}
    <span class="content-dark-color"><Label label={placeholder} /></span>
  {/if}
{:else}
  <TimeInput {value} {unit} {autoFocus} {onChange} />
{/if}
