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
  import { Label, Modal } from '@hcengineering/ui'
  import presentation from '@hcengineering/presentation'
  import { Room } from '@hcengineering/love'
  import { createEventDispatcher } from 'svelte'
  import RoomRecordingSettings from './RoomRecordingSettings.svelte'
  import love from '../plugin'
  import RoomAccessButton from './meeting/controls/RoomAccessButton.svelte'
  import { rooms } from '../stores'

  export let room: Room

  $: currentRoom = $rooms.find((value) => value._id === room._id) ?? room

  const dispatch = createEventDispatcher()

</script>

<Modal
  label={love.string.Settings}
  type="type-popup"
  okLabel={presentation.string.Close}
  okAction={() => {
    dispatch('close')
  }}
  canSave={true}
  showCancelButton={false}
  on:close
>
  <div class="antiGrid">
    <div class="antiGrid-row">
      <div class="antiGrid-row__header">
        <Label label={love.string.ChangeAccess} />
      </div>
      <RoomAccessButton room={currentRoom} size="small" />
    </div>
  </div>
  <RoomRecordingSettings room={currentRoom} />
</Modal>

<style lang="scss">
</style>
