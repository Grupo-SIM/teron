<script lang="ts">
  import { Person } from '@hcengineering/contact'
  import { AccountRole, getCurrentAccount, Ref } from '@hcengineering/core'
  import { Room } from '@hcengineering/love'
  import { ActionIcon } from '@hcengineering/ui'
  import love from '../plugin'
  import { myInfo } from '../stores'
  import { kick } from '../meetings'

  export let person: Ref<Person>
  export let room: Ref<Room>

  const canKick = [AccountRole.Owner, AccountRole.Maintainer].includes(getCurrentAccount().role)
</script>

{#if canKick && room !== love.ids.Reception && person !== $myInfo?.person}
  <ActionIcon
    size={'small'}
    label={love.string.Kick}
    icon={love.icon.Kick}
    action={() => {
      void kick(person, room)
    }}
  />
{/if}
