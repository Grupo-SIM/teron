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
  import { AccountRole, getCurrentAccount, hasAccountRole, Ref } from '@hcengineering/core'
  import love, { Floor, Room } from '@hcengineering/love'
  import { isAdminUser } from '@hcengineering/presentation'
  import { Breadcrumbs, eventToHTMLElement, Header, IconAdd, ModernButton, Scroller, showPopup } from '@hcengineering/ui'
  import { createEventDispatcher } from 'svelte'
  import { floors, rooms, selectedFloor } from '../stores'
  import FloorPreview from './FloorPreview.svelte'
  import EditFloorPopup from './EditFloorPopup.svelte'

  const dispatch = createEventDispatcher()

  const me = getCurrentAccount()
  let floor: Floor | undefined

  $: if (floor === undefined && $floors.length > 0) {
    floor = $floors[0]
  }

  function getRooms (rooms: Room[], floor: Ref<Floor>): Room[] {
    return rooms.filter((p) => p.floor === floor)
  }

  function addFloor (e: MouseEvent): void {
    showPopup(EditFloorPopup, {}, eventToHTMLElement(e))
  }

  function handleFloorRemoved (removedFloor: Floor): void {
    const nextFloor = $floors.find((candidate) => candidate._id !== removedFloor._id)
    floor = nextFloor
    selectedFloor.set(nextFloor?._id)
  }

  let editable: boolean = false
  $: editable = isAdminUser() || hasAccountRole(me, AccountRole.Maintainer)
</script>

<Header
  allowFullsize={false}
  type="type-aside"
  hideBefore={true}
  hideActions={false}
  hideDescription={true}
  adaptive="disabled"
  closeOnEscape={false}
  on:close
>
  <Breadcrumbs items={[{ label: love.string.Office }]} currentOnly />
  <svelte:fragment slot="extra">
    {#if editable}
      <ModernButton icon={IconAdd} label={love.string.AddAFloor} size={'small'} on:click={addFloor} />
    {/if}
  </svelte:fragment>
</Header>
<div class="teronModal-container noTopIndent type-aside office-floor-selector">
  <div class="teronModal-content">
    <Scroller>
      {#each $floors as _floor}
        <FloorPreview
          floor={_floor}
          configurable
          removable={$floors.length > 1}
          rooms={getRooms($rooms, _floor._id)}
          selected={floor?._id === _floor._id}
          on:select={() => {
            selectedFloor.set(_floor?._id)
            floor = _floor
            dispatch('close')
          }}
          on:remove={() => handleFloorRemoved(_floor)}
        />
      {/each}
    </Scroller>
  </div>
</div>

<style lang="scss">
  .office-floor-selector {
    background-color: var(--theme-panel-color);
  }
</style>
