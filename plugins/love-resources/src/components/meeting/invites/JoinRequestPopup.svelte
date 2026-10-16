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
  import { Button, Label } from '@hcengineering/ui'
  import love from '../../../plugin'
  import { rooms } from '../../../stores'
  import { getRoomLabel } from '../../../utils'
  import {
    cancelJoinRequest,
    closeJoinRequestPopup,
    joinRequestSecondsToLive,
    subscribeJoinResponses,
    unsubscribeJoinResponses,
    updateJoinRequest
  } from '../../../joinRequests'
  import { onMount } from 'svelte'

  export let meetingId: string

  $: room = $rooms.find((p) => p._id === meetingId)

  onMount(() => {
    let destroyed = false
    let interval: ReturnType<typeof setInterval> | undefined
    void subscribeJoinResponses().then(async () => {
      if (destroyed) {
        await unsubscribeJoinResponses()
        return
      }
      interval = setInterval(() => { void updateJoinRequest(meetingId) }, (joinRequestSecondsToLive - 2) * 1000)
      await updateJoinRequest(meetingId)
    })
    return () => {
      destroyed = true
      void unsubscribeJoinResponses()
      clearInterval(interval)
      void cancelJoinRequest(meetingId)
    }
  })

  async function cancel (): Promise<void> {
    closeJoinRequestPopup()
  }
</script>

<div class="antiPopup flex-col-center">
  <div class="mb-4 flex-col-center flex-gap-2">
    <Label label={love.string.KnockingTo} params={{ name: room?.name }} />
    <span class="title">
      {#if room}
        {#await getRoomLabel(room) then label}
          <Label {label} />
        {/await}
      {/if}
    </span>
  </div>
  <div class="flex-row-center p-1 w-full">
    <Button label={love.string.Cancel} width={'100%'} on:click={cancel} />
  </div>
</div>

<style lang="scss">
  .antiPopup {
    padding-top: 1rem;
    width: 20rem;
  }

  .title {
    color: var(--caption-color);
    font-size: 700;
  }
</style>
