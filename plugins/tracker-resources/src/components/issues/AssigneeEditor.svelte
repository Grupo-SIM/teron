<script lang="ts">
  import { Employee } from '@hcengineering/contact'
  import { EmployeeArrayEditor } from '@hcengineering/contact-resources'
  import { AccountRole, getCurrentAccount, hasAccountRole, Ref } from '@hcengineering/core'
  import { getClient } from '@hcengineering/presentation'
  import { getTaskAssignees } from '@hcengineering/task'
  import { ButtonKind, ButtonSize, IconSize, TooltipAlignment } from '@hcengineering/ui'
  import { createEventDispatcher } from 'svelte'
  import tracker from '../../plugin'

  export let object: any = undefined
  export let value: any = undefined
  export let kind: ButtonKind = 'link'
  export let size: ButtonSize = 'large'
  export let avatarSize: IconSize = 'card'
  export let tooltipAlignment: TooltipAlignment | undefined = undefined
  export let width = 'min-content'
  export let focusIndex: number | undefined = undefined
  export let short = false
  export let shouldShowName = true
  export let shrink = 0
  export let isAction = false
  export let readonly = false
  export let showStatus = true

  const client = getClient()
  const dispatch = createEventDispatcher()
  const administrator = hasAccountRole(getCurrentAccount(), AccountRole.Maintainer)
  $: target = object ?? value
  $: targets = Array.isArray(target) ? target : target === undefined ? [] : [target]
  $: selected = targets.length === 0 ? [] : getTaskAssignees(targets[0]) as Ref<Employee>[]

  async function change (refs: Ref<Employee>[]): Promise<void> {
    if (readonly || !administrator) return
    const assignees = getTaskAssignees({ assignees: refs })
    const stored = targets.filter((item) => '_class' in item)
    const operations = client.apply()
    for (const item of stored) {
      await operations.update(item, { assignees })
    }
    if (stored.length > 0) await operations.commit()
    dispatch('change', assignees)
    if (isAction) dispatch('close')
  }
</script>

<EmployeeArrayEditor label={tracker.string.Assignee} value={selected} onChange={change} {kind} {size} {width} readonly={readonly || !administrator} />
