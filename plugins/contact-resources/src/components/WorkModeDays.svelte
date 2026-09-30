<script lang="ts">
  import type { Person } from '@hcengineering/contact'
  import { getClient } from '@hcengineering/presentation'
  import { EditBox, Label } from '@hcengineering/ui'
  import contact from '../plugin'

  export let object: Person
  export let editable = false

  const client = getClient()
  let currentId = object._id
  let remote = object.remoteDaysPerWeek?.toString() ?? ''
  let onsite = object.onsiteDaysPerWeek?.toString() ?? ''
  let invalid = false

  $: if (object._id !== currentId) {
    currentId = object._id
    remote = object.remoteDaysPerWeek?.toString() ?? ''
    onsite = object.onsiteDaysPerWeek?.toString() ?? ''
    invalid = false
  }

  function parseDays (value: string): number | null | undefined {
    if (value.trim() === '') return null
    if (!/^[0-7]$/.test(value.trim())) return undefined
    return Number(value.trim())
  }

  async function save (): Promise<void> {
    if (!editable) return
    const remoteDaysPerWeek = parseDays(remote)
    const onsiteDaysPerWeek = parseDays(onsite)
    invalid =
      remoteDaysPerWeek === undefined ||
      onsiteDaysPerWeek === undefined ||
      (remoteDaysPerWeek ?? 0) + (onsiteDaysPerWeek ?? 0) > 7
    if (invalid || remoteDaysPerWeek === undefined || onsiteDaysPerWeek === undefined) return

    if (remoteDaysPerWeek === (object.remoteDaysPerWeek ?? null) && onsiteDaysPerWeek === (object.onsiteDaysPerWeek ?? null)) {
      return
    }
    await client.update(object, { remoteDaysPerWeek, onsiteDaysPerWeek })
  }
</script>

<div class="work-mode-days">
  <EditBox
    label={contact.string.RemoteDaysPerWeek}
    placeholder={contact.string.WorkDaysPerWeekPlaceholder}
    bind:value={remote}
    disabled={!editable}
    on:change={save}
  />
  <EditBox
    label={contact.string.OnsiteDaysPerWeek}
    placeholder={contact.string.WorkDaysPerWeekPlaceholder}
    bind:value={onsite}
    disabled={!editable}
    on:change={save}
  />
</div>
{#if invalid}
  <div class="work-mode-error"><Label label={contact.string.WorkDaysPerWeekInvalid} /></div>
{/if}

<style lang="scss">
  .work-mode-days {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .work-mode-error {
    margin-top: 0.25rem;
    color: var(--theme-status-error-color, #d33);
  }
</style>
