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
    IconChevronDown,
    IconChevronRight,
    IconDelete,
    IconEdit,
    IconMoreH,
    SelectPopup,
    eventToHTMLElement,
    showPopup,
    tooltip,
    type SelectPopupValueType
  } from '@hcengineering/ui'
  import { Floor, ParticipantInfo, Room } from '@hcengineering/love'
  import { createEventDispatcher } from 'svelte'
  import { translate } from '@hcengineering/platform'
  import { getCurrentLanguage } from '@hcengineering/theme'
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
  export let dragging: boolean = false
  export let sortingDisabled: boolean = false
  let expanded = true
  let reorderLabel = ''
  $: void translate(plugin.string.ReorderFloors, {}, getCurrentLanguage()).then((label) => { reorderLabel = label })
  $: if (rooms.length === 0) expanded = true

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

<div class="floor-preview preview" class:selected class:empty={rooms.length === 0} class:expanded={expanded && !dragging}>
  <div class="floor-row">
    {#if configurable && editable}
      <button
        class="floor-drag-handle"
        aria-label={`${reorderLabel} ${floor.name}`}
        disabled={sortingDisabled}
        use:tooltip={{ label: plugin.string.ReorderFloors, direction: 'bottom' }}
        on:pointerdown={(event) => dispatch('dragstart', event)}
        on:keydown={(event) => dispatch('reorderkey', event)}
      >
        <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true">
          {#each [4, 9, 14] as y}
            <circle cx="4" cy={y} r="1.5" /><circle cx="10" cy={y} r="1.5" />
          {/each}
        </svg>
      </button>
    {/if}
    {#if rooms.length > 0}
      <button class="floor-select" aria-expanded={expanded} on:click={() => (expanded = !expanded)}>
        <span class="overflow-label">{floor.name}</span>
        <Icon icon={expanded ? IconChevronDown : IconChevronRight} size={'small'} />
      </button>
    {:else}
      <div class="floor-select floor-title">
        <span class="overflow-label">{floor.name}</span>
      </div>
    {/if}
    <button
      class="floor-activate"
      class:selected
      aria-label={floor.name}
      aria-pressed={selected}
      use:tooltip={{ label: plugin.string.EnterFloor, direction: 'bottom' }}
      on:click={() => dispatch('select')}
    >
      <Icon icon={plugin.icon.EnterRoom} size={'small'} />
    </button>
    {#if configurable && editable}
      <ButtonIcon icon={IconMoreH} kind={'tertiary'} size={'small'} {pressed} on:click={clickMore} />
    {/if}
  </div>
  {#if expanded && !dragging}
    <div class="floor-card" class:selected>
      {#if rooms.length > 0}
        <div class="floor-preview-content">
          <FloorGrid bind:floorContainer {rows} preview>
            {#each rooms as room}
              <RoomPreview {room} info={getInfo(room._id, $infos)} />
            {/each}
          </FloorGrid>
        </div>
      {:else}
        <button class="floor-empty-select" aria-label={floor.name} on:click={() => dispatch('select')}>
          <span>+</span>
        </button>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .floor-preview {
    width: 100%;
    min-width: 0;

    &.empty.expanded {
      flex: 0 0 10rem;
      max-width: 100%;
      min-height: 9rem;
    }
  }

  .floor-card {
    width: 100%;
    min-width: 0;
    border: 1px solid var(--global-ui-BorderColor);
    border-radius: var(--small-BorderRadius);
    background-color: var(--theme-panel-color);

    &.selected {
      border-color: var(--theme-button-focused-border);
      background-color: var(--theme-panel-color);
    }
  }

  .floor-drag-handle {
    display: flex;
    padding: 0.35rem;
    border: 1px solid var(--global-ui-BorderColor);
    border-radius: var(--small-BorderRadius);
    color: var(--theme-content-color);
    cursor: grab;
    touch-action: none;

    &:active { cursor: grabbing; }
    &:disabled { cursor: not-allowed; opacity: 0.5; }
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

  .floor-title {
    cursor: default;
  }

  .floor-activate {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border: 1px solid var(--global-ui-BorderColor);
    border-radius: var(--small-BorderRadius);
    color: var(--theme-content-color);
    cursor: pointer;
    opacity: 0.5;

    &.selected {
      opacity: 1;
    }
  }

  .floor-empty-select {
    display: block;
    width: 100%;
    min-height: 5rem;
    padding: 0.5rem;
    cursor: pointer;
    text-align: center;
    color: var(--theme-content-color);
    background: transparent;
    border: 0;
  }

  .floor-preview-content {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 0.5rem;
    overflow: hidden;

    :global(.floorGrid) {
      min-width: 0 !important;
      max-width: 100% !important;
      // Labels sit above room borders and need space between adjacent rows.
      row-gap: 1rem;
      aspect-ratio: auto !important;
      padding-top: 1rem;
    }
  }
</style>
