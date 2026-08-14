<script lang="ts">
  import { DeleteConfirmationPopup } from '@hcengineering/contact-resources'
  import { Status } from '@hcengineering/core'
  import { getEmbeddedLabel } from '@hcengineering/platform'
  import { createQuery } from '@hcengineering/presentation'
  import task, { TaskType } from '@hcengineering/task'
  import { ButtonMenu, Label } from '@hcengineering/ui'
  import plugin from '../../plugin'

  export let object: Status
  export let taskType: TaskType
  export let deleteAction: (newStatus: Status) => Promise<void>
  export let selectableStates: Status[] = []

  const query = createQuery()
  let total: number = 0

  $: query.query(
    task.class.Task,
    { status: object._id, kind: taskType._id },
    (res) => {
      total = res.total
    },
    { limit: 1, total: true }
  )
  const items = selectableStates.map((it) => ({ id: it._id, label: getEmbeddedLabel(it.name) }))
  let selected = items?.[0]?.id ?? ''

  $: selectedState = selectableStates.find((it) => it._id === selected)
</script>

<DeleteConfirmationPopup
  {object}
  deleteAction={async () => {
    if (selectedState !== undefined) {
      await deleteAction(selectedState)
    }
  }}
  on:close
  canDeleteExtra={selectedState !== undefined}
>
  <div class="flex-grow mt-4">
    {#if total > 0}
      <div class="flex-grow justify-between">
        <span class="fs-title"><Label label={plugin.string.UpdateTasksStatusRequest} params={{ total }} /></span>
      </div>
      <div class="flex-grow justify-between mt-2">
        <ButtonMenu
          {items}
          {selected}
          label={getEmbeddedLabel(selectedState?.name ?? '')}
          kind={'secondary'}
          size={'medium'}
          on:selected={(it) => {
            selected = it.detail
          }}
        />
      </div>
    {/if}
  </div>
</DeleteConfirmationPopup>
