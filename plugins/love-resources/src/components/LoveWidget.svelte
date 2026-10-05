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
  import { getClient, isAdminUser } from '@hcengineering/presentation'
  import { Breadcrumbs, eventToHTMLElement, Header, IconAdd, ModernButton, Scroller, showPopup } from '@hcengineering/ui'
  import { createEventDispatcher } from 'svelte'
  import { flip } from 'svelte/animate'
  import { translate } from '@hcengineering/platform'
  import { addNotification, NotificationSeverity } from '@hcengineering/ui'
  import { getCurrentLanguage } from '@hcengineering/theme'
  import NotificationToast from '@hcengineering/ui/src/components/NotificationToast.svelte'
  import plugin from '../plugin'
  import { floors, rooms, selectedFloor } from '../stores'
  import FloorPreview from './FloorPreview.svelte'
  import EditFloorPopup from './EditFloorPopup.svelte'

  const dispatch = createEventDispatcher()
  let ordered: Floor[] = []
  let original: Floor[] = []
  let dragging: Ref<Floor> | undefined
  let saving = false
  let list: HTMLDivElement
  let offset = 0
  let grabY = 0
  let listHeight = 0
  let topBound = 0
  let bottomBound = 0
  let handle: HTMLElement | undefined
  let pointerId: number | undefined
  $: if (dragging === undefined && !saving) ordered = $floors

  function move (id: Ref<Floor>, index: number): void {
    const from = ordered.findIndex((item) => item._id === id)
    if (from < 0 || from === index) return
    const next = [...ordered]
    const [item] = next.splice(from, 1)
    next.splice(index, 0, item)
    ordered = next
  }

  async function saveOrder (): Promise<void> {
    if (ordered.every((item, index) => item._id === original[index]?._id)) return
    saving = true
    try {
      const ops = getClient().apply()
      for (const [sortOrder, item] of ordered.entries()) {
        await ops.updateDoc(love.class.Floor, item.space, item._id, { sortOrder })
      }
      const result = await ops.commit()
      if (!result.result) throw new Error('Floor order transaction rejected')
      floors.set(ordered.map((item, sortOrder) => ({ ...item, sortOrder })))
      const message = await translate(plugin.string.FloorsReordered, {}, getCurrentLanguage())
      addNotification(message, '', NotificationToast, { title: message, severity: NotificationSeverity.Success })
    } catch (error) {
      console.error('Failed to reorder floors', error)
      ordered = $floors
      const message = await translate(plugin.string.FloorReorderFailed, {}, getCurrentLanguage())
      addNotification(message, '', NotificationToast, { title: message, severity: NotificationSeverity.Error }, NotificationSeverity.Error)
    } finally {
      saving = false
    }
  }

  function startDrag (id: Ref<Floor>, event: PointerEvent): void {
    if (!editable || saving || event.button !== 0) return
    event.preventDefault()
    original = [...ordered]
    dragging = id
    offset = 0
    handle = event.currentTarget as HTMLElement
    pointerId = event.pointerId
    const card = handle.closest('[data-floor]') as HTMLElement
    const rect = card.getBoundingClientRect()
    const bounds = list.getBoundingClientRect()
    grabY = event.clientY - rect.top
    topBound = bounds.top
    bottomBound = bounds.bottom
    listHeight = bounds.height
    handle.setPointerCapture(event.pointerId)
  }

  function dragMove (event: PointerEvent): void {
    if (dragging === undefined || event.pointerId !== pointerId) return
    const card = handle?.closest('[data-floor]') as HTMLElement
    const content = card.firstElementChild as HTMLElement
    const rect = content.getBoundingClientRect()
    const baseTop = rect.top - offset
    const top = Math.max(topBound, Math.min(bottomBound - rect.height, event.clientY - grabY))
    offset = top - baseTop
    const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-floor]'))
    const target = cards.findIndex((card) => {
      const rect = card.getBoundingClientRect()
      return event.clientY < rect.top + rect.height / 2
    })
    move(dragging, target < 0 ? ordered.length - 1 : target)
  }

  function endDrag (cancel = false): void {
    if (dragging === undefined) return
    if (pointerId !== undefined && handle?.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId)
    dragging = undefined
    pointerId = undefined
    offset = 0
    listHeight = 0
    if (cancel) ordered = original
    else void saveOrder()
  }

  function reorderKey (id: Ref<Floor>, event: KeyboardEvent): void {
    if (event.key === 'Escape') { endDrag(true); return }
    if (!editable || saving || dragging !== undefined || !['ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    original = [...ordered]
    const index = ordered.findIndex((item) => item._id === id)
    move(id, Math.max(0, Math.min(ordered.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1))))
    void saveOrder()
  }

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

<svelte:window
  on:pointermove={dragMove}
  on:pointerup={() => endDrag()}
  on:pointercancel={() => endDrag(true)}
  on:blur={() => endDrag(true)}
  on:keydown={(event) => { if (event.key === 'Escape' && dragging !== undefined) { event.preventDefault(); event.stopPropagation(); endDrag(true) } }}
/>

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
      <div class="office-floors" bind:this={list} style:min-height={dragging !== undefined ? `${listHeight}px` : undefined}>
        {#each ordered as _floor (_floor._id)}
          <div class="sortable-floor" data-floor={_floor._id} animate:flip={{ duration: 180 }}>
          <div class:dragging={dragging === _floor._id} style:transform={dragging === _floor._id ? `translateY(${offset}px)` : undefined}>
          <FloorPreview
            floor={_floor}
            configurable
            dragging={dragging === _floor._id}
            sortingDisabled={saving}
            on:dragstart={(event) => startDrag(_floor._id, event.detail)}
            on:reorderkey={(event) => reorderKey(_floor._id, event.detail)}
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
          </div>
          </div>
        {/each}
      </div>
    </Scroller>
  </div>
</div>

<style lang="scss">
  .office-floors {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 0.5rem 0.5rem;
  }

  .sortable-floor { width: 100%; min-width: 0; }
  .dragging { position: relative; z-index: 1; opacity: 0.6; }

  .office-floor-selector {
    background-color: var(--theme-panel-color);
  }
</style>
