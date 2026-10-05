<script lang="ts">
  import type { IntlString } from '@hcengineering/platform'
  import EstimationValueEditor from './EstimationValueEditor.svelte'

  export let placeholder: IntlString
  export let value: number | undefined
  export let onChange: (value: number | undefined) => void
</script>

<EstimationValueEditor {...$$restProps} {placeholder} {value} {onChange} unit="hours" />
