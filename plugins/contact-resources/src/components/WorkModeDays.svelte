<script lang="ts">
  import type { Person } from '@hcengineering/contact'
  import { EditBox, Label } from '@hcengineering/ui'
  import contact from '../plugin'

  export let object: Person
  export let attributeKey: 'remoteDaysPerWeek' | 'onsiteDaysPerWeek'
  export let value: number | null | undefined = undefined
  export let readonly = false
  export let onChange: (value: number | null) => void

  let input = ''
  let invalid = false
  $: input = value?.toString() ?? ''
  $: otherKey = attributeKey === 'remoteDaysPerWeek' ? 'onsiteDaysPerWeek' : 'remoteDaysPerWeek'

  function save (): void {
    const text = input.trim()
    const days = text === '' ? null : Number(text)
    invalid = (text !== '' && !/^[0-7]$/.test(text)) || (days ?? 0) + (object[otherKey] ?? 0) > 7
    if (invalid || readonly) return
    onChange(days)
  }
</script>

<div class="work-mode-day" data-work-mode={attributeKey}>
  <EditBox
    placeholder={contact.string.WorkDaysPerWeekPlaceholder}
    bind:value={input}
    disabled={readonly}
    on:change={save}
  />
  {#if invalid}
    <div class="work-mode-error"><Label label={contact.string.WorkDaysPerWeekInvalid} /></div>
  {/if}
</div>

<style lang="scss">
  .work-mode-day {
    min-width: 0;
    width: 100%;
  }
  .work-mode-error {
    margin-top: 0.25rem;
    color: var(--theme-status-error-color, #d33);
  }
</style>
