<script lang="ts">
  import { getClient } from '@hcengineering/presentation'
  import { addNotification, NotificationSeverity, RadioGroup, RadioItem } from '@hcengineering/ui'
  import { Room, RoomAccess, isOffice, roomAccessLabel } from '@hcengineering/love'
  import { createEventDispatcher } from 'svelte'
  import { getCurrentEmployee } from '@hcengineering/contact'
  import { translate } from '@hcengineering/platform'
  import { getCurrentLanguage } from '@hcengineering/theme'
  import NotificationToast from '@hcengineering/ui/src/components/NotificationToast.svelte'

  export let room: Room

  const client = getClient()
  const dispatch = createEventDispatcher()

  async function setAccess (access: RoomAccess): Promise<void> {
    if (isOffice(room) && room.person !== getCurrentEmployee()) return
    await client.update(room, { access })
    const message = await translate(roomAccessLabel[access], {}, getCurrentLanguage())
    addNotification(message, '', NotificationToast, { title: message, severity: NotificationSeverity.Success })
    dispatch('close', access)
  }

  const items: RadioItem[] = isOffice(room)
    ? [
        {
          value: RoomAccess.Knock,
          labelIntl: roomAccessLabel[RoomAccess.Knock],
          action: async () => {
            await setAccess(RoomAccess.Knock)
          }
        },
        {
          value: RoomAccess.DND,
          labelIntl: roomAccessLabel[RoomAccess.DND],
          action: async () => {
            await setAccess(RoomAccess.DND)
          }
        }
      ]
    : [
        {
          value: RoomAccess.Open,
          labelIntl: roomAccessLabel[RoomAccess.Open],
          action: async () => {
            await setAccess(RoomAccess.Open)
          }
        },
        {
          value: RoomAccess.Knock,
          labelIntl: roomAccessLabel[RoomAccess.Knock],
          action: async () => {
            await setAccess(RoomAccess.Knock)
          }
        },
        {
          value: RoomAccess.DND,
          labelIntl: roomAccessLabel[RoomAccess.DND],
          action: async () => {
            await setAccess(RoomAccess.DND)
          }
        }
      ]
</script>

<div class="antiPopup p-4">
  <RadioGroup {items} gap={'large'} selected={room.access} />
</div>
