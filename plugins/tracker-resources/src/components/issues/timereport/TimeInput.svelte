<script lang="ts">
  import { DropdownLabelsIntl, EditBox } from '@hcengineering/ui'
  import tracker from '../../../plugin'
  import { hoursPerUnit, toHours, type TimeUnit } from './time-input'

  export let value: number | undefined
  export let unit: TimeUnit = 'hours'
  export let autoFocus = false
  export let onChange: (value: number | undefined) => void

  const items = [
    { id: 'hours', label: tracker.string.TimeUnitHours },
    { id: 'days', label: tracker.string.TimeUnitDays },
    { id: 'minutes', label: tracker.string.TimeUnitMinutes }
  ]
  $: amount = value == null ? undefined : value / hoursPerUnit(unit)

  function changeUnit (next: TimeUnit): void {
    unit = next
  }
</script>

<div class="flex-row-center gap-2">
  <EditBox
    bind:value={amount}
    placeholder={tracker.string.TimeInputAmount}
    format="number"
    minValue={0}
    {autoFocus}
    select
    maxWidth="8rem"
    on:value={() => {
      if (amount != null && Number.isFinite(amount) && amount >= 0) {
        value = toHours(amount, unit)
        onChange(value)
      } else {
        value = undefined
        onChange(undefined)
      }
    }}
    on:keydown
  />
  <DropdownLabelsIntl
    {items}
    selected={unit}
    label={tracker.string.TimeUnit}
    kind="regular"
    width="8rem"
    on:selected={(event) => changeUnit(event.detail)}
  />
</div>
