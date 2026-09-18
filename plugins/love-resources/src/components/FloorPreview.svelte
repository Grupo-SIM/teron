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
  import { AccountRole, getCurrentAccount, hasAccountRole, type Ref } from '@hcengineering/core'
  import { getClient, isAdminUser, MessageBox } from '@hcengineering/presentation'
  import {
    ButtonIcon,
    Icon,
    IconCheck,
    IconDelete,
    IconEdit,
    IconMoreH,
    SelectPopup,
    eventToHTMLElement,
    showPopup,
    type SelectPopupValueType
  } from '@hcengineering/ui'
  import { Floor, ParticipantInfo, Room } from '@hcengineering/love'
  import { createEventDispatcher } from 'svelte'
  import plugin from '../plugin'
  import { infos } from '../stores'
  import { calculateFloorSize } from '../utils'
  import EditFloorPopup from './EditFloorPopup.svelte'
  import FloorGrid from './FloorGrid.svelte'
  import RoomPreview from './RoomPreview.svelte'

  export let floor: Floor
  export let configurable: boolean = false
  export let rooms: Room[] = []
  export let selected: boolean
  export let removable: boolean = true

  const me = getCurrentAccount()
  const dispatch = createEventDispatcher()

  $: editable = isAdminUser() || hasAccountRole(me, AccountRole.Maintainer)

  const client = getClient()
  let floorContainer: HTMLDivElement
  $: rows = calculateFloorSize(rooms)

  function getInfo (room: Ref<Room>, info: ParticipantInfo[]): ParticipantInfo[] {
    return info.filter((participant) => participant.room === room)
  }

  function remove (): void {
    showPopup(MessageBox, {
      label: plugin.string.DeleteFloor,
      message: plugin.string.DeleteFloorConfirm,
      params: { name: floor.name },
      dangerous: true,
      action: async () => {
        for (const room of rooms) {
          await client.remove(room)
        }
        await client.remove(floor)
        dispatch('remove', floor)
      }
    })
  }

  function renameFloor (): void {
    showPopup(EditFloorPopup, { id: floor._id }, 'top', () => {
      pressed = false
    })
  }

  let pressed: boolean = false
  const clickMore = (e: MouseEvent): void => {
    pressed = true
    const value: SelectPopupValueType[] = [{ id: 'rename', icon: IconEdit, label: plugin.string.RenameAFloor }]
    if (removable) {
      value.push({ id: 'delete', icon: IconDelete, label: plugin.string.DeleteFloor })
    }
    showPopup(SelectPopup, { value }, eventToHTMLElement(e), (result) => {
      pressed = false
      if (result === 'rename') renameFloor()
      else if (result === 'delete') remove()
    })
  }
</script>

<div class="floor-card preview" class:selected>
  <div class="floor-row">
    <button class="floor-select" on:click={() => dispatch('select')}>
      <span class="overflow-label">{floor.name}</span>
      {#if selected}
        <Icon icon={IconCheck} size={'small'} />
      {/if}
    </button>
    {#if configurable && editable}
      <ButtonIcon icon={IconMoreH} kind={'tertiary'} size={'small'} {pressed} on:click={clickMore} />
    {/if}
  </div>
  <button class="floor-preview" aria-label={floor.name} on:click={() => dispatch('select')}>
    <div class="floor-preview-content">
      <FloorGrid bind:floorContainer {rows} preview>
        {#each rooms as room}
          <RoomPreview {room} info={getInfo(room._id, $infos)} preview />
        {/each}
      </FloorGrid>
    </div>
  </button>
</div>

<style lang="scss">
  .floor-card {
    margin: 0 0.5rem 0.5rem;
    border: 1px solid var(--global-ui-BorderColor);
    border-radius: var(--small-BorderRadius);
    background-color: var(--theme-button-default);

    &.selected {
      border-color: var(--theme-button-focused-border);
      background-color: var(--theme-button-pressed);
    }
  }

  .floor-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem;
  }

  .floor-select {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    padding: 0.5rem;
    color: var(--theme-content-color);
    cursor: pointer;
  }

  .floor-preview {
    display: block;
    width: 100%;
    padding: 0 0.5rem 0.5rem;
    cursor: pointer;
  }

  .floor-preview-content {
    display: flex;
    justify-content: center;
    width: 100%;
    overflow: hidden;
    pointer-events: none;

    :global(.floorGrid) {
      min-width: 0 !important;
      max-width: 100% !important;
    }
  }
</style>
