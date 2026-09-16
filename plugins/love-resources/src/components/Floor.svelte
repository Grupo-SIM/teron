<!--
// Copyright © 2024 Hardcore Engineering Inc.
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
  import { AccountRole, getCurrentAccount, hasAccountRole, Ref, WithLookup } from '@hcengineering/core'
  import { Floor, Room } from '@hcengineering/love'
  import { getClient, isAdminUser } from '@hcengineering/presentation'
  import { Component, Header, IconEdit, ModernButton } from '@hcengineering/ui'
  import { Viewlet, ViewletPreference } from '@hcengineering/view'
  import { ViewletSelector } from '@hcengineering/view-resources'
  import workbench, { Widget } from '@hcengineering/workbench'
  import { openWidget } from '@hcengineering/workbench-resources'
  import { createEventDispatcher } from 'svelte'

  import lovePlg from '../plugin'
  import { floors } from '../stores'

  export let rooms: Room[] = []
  export let floor: Ref<Floor>

  const dispatch = createEventDispatcher()

  let viewlet: WithLookup<Viewlet> | undefined
  let preference: ViewletPreference | undefined
  let loading = false

  let selected = $floors.filter((fl) => fl._id === floor)[0]
  $: selected = $floors.filter((fl) => fl._id === floor)[0]

  const me = getCurrentAccount()

  let editable: boolean = false
  $: editable = isAdminUser() || hasAccountRole(me, AccountRole.Maintainer)

  function openOfficeDrawer (): void {
    const widget = getClient().getModel().findAllSync<Widget>(workbench.class.Widget, { _id: lovePlg.ids.LoveWidget })[0]
    if (widget !== undefined) {
      openWidget(widget, undefined, { active: true, openedByUser: true })
    }
  }
</script>

<div class="teronComponent">
  <Header adaptive={'disabled'}>
    <span class="overflow-label">{selected?.name}</span>
    <svelte:fragment slot="beforeTitle">
      <ViewletSelector bind:viewlet bind:preference bind:loading viewletQuery={{ attachTo: lovePlg.class.Floor }} />
    </svelte:fragment>
    <svelte:fragment slot="actions">
      {#if editable}
        <ModernButton label={lovePlg.string.ChangeFloor} size={'small'} on:click={openOfficeDrawer} />
        <ModernButton
          icon={IconEdit}
          label={lovePlg.string.EditOffice}
          size={'small'}
          on:click={() => dispatch('configure')}
        />
      {:else}
        <ModernButton label={lovePlg.string.ChangeFloor} size={'small'} on:click={openOfficeDrawer} />
      {/if}
    </svelte:fragment>
  </Header>
  <div class="teronComponent-content__column content">
    {#if viewlet?.$lookup?.descriptor?.component}
      <Component is={viewlet.$lookup.descriptor.component} props={{ floor, rooms }} on:open />
    {/if}
  </div>
</div>
