<script lang="ts">
  import { Person } from '@hcengineering/contact'
  import { Ref } from '@hcengineering/core'
  import { Room, RoomAccess } from '@hcengineering/love'
  import { ActionIcon } from '@hcengineering/ui'
  import love from '../plugin'
  import { myInfo } from '../stores'
  import { joinMeeting } from '../meetings'
  import KickParticipantButton from './KickParticipantButton.svelte'
  import { sendInvites } from '../invites'

  export let room: Room
  export let person: Ref<Person>
</script>

<div class="p-3 flex-gap-2 antiPopup">
  <KickParticipantButton {person} room={room._id} />
  {#if $myInfo?.room !== room._id && room.access !== RoomAccess.DND}
    <ActionIcon
      size={'small'}
      label={love.string.Invite}
      icon={love.icon.Invite}
      action={() => {
        sendInvites([person])
      }}
    />
    {#if room.access === RoomAccess.Knock}
      <ActionIcon
        size={'small'}
        label={love.string.KnockAction}
        icon={love.icon.Knock}
        action={() => {
          void joinMeeting(room)
        }}
      />
    {/if}
  {/if}
</div>

<style lang="scss">
  .antiPopup {
    flex-direction: row;
    margin-top: -0.75rem;
  }
</style>
