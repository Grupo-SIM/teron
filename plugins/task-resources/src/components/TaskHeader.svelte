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
  import { Doc, Mixin } from '@hcengineering/core'
  import { AttributesBar, getClient, KeyedAttribute } from '@hcengineering/presentation'
  import { EmployeeArrayEditor } from '@hcengineering/contact-resources'
  import { getTaskAssignees } from '@hcengineering/task'
  import { Task } from '@hcengineering/task'
  import task from '../plugin'
  import { DocAttributeBar } from '@hcengineering/view-resources'

  export let object: Task
  export let keys: KeyedAttribute[]
  export let mixins: Mixin<Doc>[]
  export let ignoreKeys: string[]
  export let vertical: boolean = false
  export let allowedCollections: string[] = []
  export let readonly: boolean = false

  const client = getClient()
  const hierarchy = client.getHierarchy()

  async function change (assignees: Task['assignees']): Promise<void> {
    if (readonly) return
    await client.update(object, { assignees: getTaskAssignees({ assignees }) })
  }
  $: assigneeTitle = hierarchy.getAttribute(object._class, 'assignees').label
  const taskKeys = ['status', 'assignee', 'assignees']

  $: filtredKeys = keys.filter((p) => !taskKeys.includes(p.key)) // todo
</script>

{#if !vertical}
  <div class="task-attr-header">
    <div class="flex-center">
      <EmployeeArrayEditor
        label={assigneeTitle}
        value={getTaskAssignees(object)}
        onChange={change}
        {readonly}
      />
      <div class="column">
        <AttributesBar {object} _class={object._class} keys={filtredKeys} {readonly} />
      </div>
    </div>
    <AttributesBar {object} _class={object._class} keys={['status']} showHeader={false} {readonly} />
  </div>
{:else}
  <DocAttributeBar
    {object}
    {ignoreKeys}
    {mixins}
    {allowedCollections}
    {readonly}
    on:update
  />
{/if}

<style lang="scss">
  .task-attr-header {
    display: flex;
    justify-content: space-between;
    flex-wrap: nowrap;
    align-items: center;
    width: 100%;
    // padding: 0 0.5rem;

    .column {
      position: relative;
      margin-left: 3rem;
      &::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: -1.5rem;
        width: 1px;
        background-color: var(--accent-bg-color);
      }
    }
  }
</style>
