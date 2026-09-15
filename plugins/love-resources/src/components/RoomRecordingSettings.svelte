<script lang="ts">
  import { Label, ModernToggle } from '@hcengineering/ui'
  import love, { Room } from '@hcengineering/love'
  import { getClient } from '@hcengineering/presentation'

  export let room: Room

  const client = getClient()

  async function toggleRecording (): Promise<void> {
    await client.diffUpdate(room, { startWithRecording: !room.startWithRecording })
  }
</script>

<div class="antiGrid">
  <div class="antiGrid-row">
    <div class="antiGrid-row__header">
      <Label label={love.string.StartWithRecording} />
    </div>
    <ModernToggle size="small" checked={room.startWithRecording} on:change={toggleRecording} />
  </div>
</div>
