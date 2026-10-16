<script lang="ts">
  import { Person } from '@hcengineering/contact'
  import { AccountRole, getCurrentAccount, Ref } from '@hcengineering/core'
  import { isOffice, Room } from '@hcengineering/love'
  import { ActionIcon } from '@hcengineering/ui'
  import love from '../plugin'
  import { myInfo, rooms } from '../stores'
  import { kick } from '../meetings'

  export let person: Ref<Person>
  export let room: Ref<Room>

  $: participantRoom = $rooms.find((candidate) => candidate._id === room)
  $: ownsRoom = participantRoom !== undefined && isOffice(participantRoom) && participantRoom.person === person

  $: canKick = [AccountRole.Owner, AccountRole.Maintainer].includes(getCurrentAccount().role) ||
    (participantRoom !== undefined && isOffice(participantRoom) && participantRoom.person === $myInfo?.person)
</script>

{#if canKick && !ownsRoom && participantRoom !== undefined && room !== love.ids.Reception && person !== $myInfo?.person}
  <ActionIcon
    size={'small'}
    label={love.string.Kick}
    icon={love.icon.Kick}
    action={() => {
      void kick(person, room)
    }}
  />
{/if}
