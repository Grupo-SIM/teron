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
  import { ActionContext } from '@hcengineering/presentation'
  import { Room as TypeRoom } from '@hcengineering/love'
  import { getMetadata } from '@hcengineering/platform'
  import { Label, Loading, deviceOptionsStore as deviceInfo } from '@hcengineering/ui'
  import { onDestroy, onMount } from 'svelte'

  import love from '../plugin'
  import { waitForOfficeLoaded, currentRoom } from '../stores'
  import { isFullScreen } from '../utils'
  import { fitParticipantGrid } from './meeting/participant-grid'
  import ControlBar from './meeting/ControlBar.svelte'
  import ParticipantsListView from './meeting/ParticipantsListView.svelte'
  import ScreenSharingView from './meeting/ScreenSharingView.svelte'

  export let canMaximize: boolean = true
  export let room: TypeRoom

  let roomEl: HTMLDivElement

  let withScreenSharing: boolean = false
  let loading: boolean = false
  let configured: boolean = false

  onMount(async () => {
    loading = true
    const wsURL = getMetadata(love.metadata.WebSocketURL)

    if (wsURL === undefined) {
      return
    }
    configured = true

    await waitForOfficeLoaded()

    roomEl && roomEl.addEventListener('fullscreenchange', handleFullScreen)
    loading = false
  })

  let gridStyle = ''
  let columns = 1
  let participantCount = 0
  let availableWidth = 0
  let availableHeight = 0

  onDestroy(() => {
    roomEl.removeEventListener('fullscreenchange', handleFullScreen)
  })

  function updateStyle (count: number, screenSharing: boolean, width: number, height: number, mobile: boolean): void {
    const gap = mobile ? 4 : 16
    const grid = fitParticipantGrid(count, width, height, gap)
    columns = screenSharing ? 1 : grid.columns
    gridStyle = `grid-template-columns: repeat(${grid.columns}, minmax(0, 1fr)); gap: ${gap}px; width: ${grid.width}px; height: ${grid.height}px;`
  }

  const handleFullScreen = () => ($isFullScreen = document.fullscreenElement != null)

  function checkFullscreen (): void {
    const needFullScreen = $isFullScreen
    if (document.fullscreenElement && !needFullScreen) {
      document
        .exitFullscreen()
        .then(() => {
          $isFullScreen = false
        })
        .catch((err) => {
          console.log(`Error exiting fullscreen mode: ${err.message} (${err.name})`)
          $isFullScreen = false
        })
    } else if (!document.fullscreenElement && needFullScreen && roomEl != null) {
      roomEl
        .requestFullscreen()
        .then(() => {
          $isFullScreen = true
        })
        .catch((err) => {
          console.log(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`)
          $isFullScreen = false
        })
    }
  }

  function onFullScreen (): void {
    const needFullScreen = !$isFullScreen
    if (!document.fullscreenElement && needFullScreen && roomEl != null) {
      roomEl
        .requestFullscreen()
        .then(() => {
          $isFullScreen = true
        })
        .catch((err) => {
          console.log(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`)
          $isFullScreen = false
        })
    } else if (!needFullScreen) {
      document
        .exitFullscreen()
        .then(() => {
          $isFullScreen = false
        })
        .catch((err) => {
          console.log(`Error exiting fullscreen mode: ${err.message} (${err.name})`)
          $isFullScreen = false
        })
    }
  }

  $: if (((document.fullscreenElement && !$isFullScreen) || $isFullScreen) && roomEl) checkFullscreen()
  $: updateStyle(participantCount, withScreenSharing, availableWidth, availableHeight, $deviceInfo.isMobile)
</script>

<div bind:this={roomEl} class="room-root flex-col-center w-full h-full" class:theme-dark={$isFullScreen}>
  <ActionContext context={{ mode: 'workbench' }} />
  {#if !configured}
    <div class="flex justify-center error h-full w-full clear-mins">
      <Label label={love.string.ServiceNotConfigured} />
    </div>
  {:else if loading}
    <Loading />
  {/if}
  <div
    class="room-container"
    class:sharing={withScreenSharing}
    class:hidden={loading}
    class:mobile={$deviceInfo.isMobile}
  >
    <div class="screenContainer">
      <ScreenSharingView bind:hasActiveTrack={withScreenSharing} />
    </div>
    <div class="participant-area" bind:clientWidth={availableWidth} bind:clientHeight={availableHeight}>
      <div class="videoGrid" style={withScreenSharing ? '' : gridStyle} class:scroll-m-0={withScreenSharing}>
        <ParticipantsListView
          room={room._id}
          on:participantsCount={(evt) => {
            participantCount = evt.detail
          }}
        />
      </div>
    </div>
  </div>
  {#if $currentRoom}
    <ControlBar room={$currentRoom} fullScreen={$isFullScreen} {onFullScreen} {canMaximize} />
  {/if}
</div>

<style lang="scss">
  .room-root {
    min-height: 0;
    overflow: hidden;
  }
  .error {
    font-weight: 500;
    font-size: 1.5rem;
    align-items: center;
  }
  .room-container {
    display: flex;
    justify-content: center;
    padding: 1rem;
    width: 100%;
    flex: 1;
    overflow: hidden;
    min-width: 0;
    min-height: 0;

    .screenContainer {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      max-height: 100%;
      min-height: 0;
      width: 100%;
      border-radius: 0.75rem;

      .screen {
        object-fit: contain;
        max-width: 100%;
        max-height: 100%;
        height: 100%;
        width: 100%;
        border-radius: 0.75rem;
      }
    }
    .participant-area {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }
    &:not(.sharing) {
      gap: 0;

      .videoGrid {
        display: grid;
        grid-auto-rows: 1fr;
        justify-content: center;
        align-items: stretch;
        gap: 1rem;
        max-height: 100%;
        max-width: 100%;
      }
      .screenContainer {
        display: none;
      }
    }
    &.sharing {
      gap: 1rem;

      .participant-area {
        width: 15rem;
        flex-shrink: 0;
      }
      .videoGrid {
        height: 100%;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 0.5rem 0;
        padding: 0 0.5rem;
        width: 15rem;
        min-width: 15rem;
        min-height: 0;
        max-width: 15rem;
      }
    }

    &.mobile {
      padding: var(--spacing-0_5);

      &:not(.sharing) .videoGrid,
      &.sharing {
        gap: var(--spacing-0_5);
      }
    }
  }
  .hidden {
    display: none;
  }
</style>
