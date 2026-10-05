<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Button, IconCheck, resizeObserver } from '@hcengineering/ui'
  import TimeInput from './TimeInput.svelte'
  import type { TimeUnit } from './time-input'

  export let value: number | undefined
  export let unit: TimeUnit = 'hours'
  const dispatch = createEventDispatcher()

  function save (): void {
    if (value != null && Number.isFinite(value) && value >= 0) dispatch('close', value)
  }
</script>

<div class="selectPopup" use:resizeObserver={() => dispatch('changeContent')}>
  <div class="flex-row-center gap-2 p-2">
    <TimeInput {value} {unit} autoFocus onChange={(result) => { value = result }} on:keydown={(event) => { if (event.key === 'Enter') save() }} />
    <Button icon={IconCheck} size="small" disabled={value == null || !Number.isFinite(value) || value < 0} on:click={save} />
  </div>
</div>
