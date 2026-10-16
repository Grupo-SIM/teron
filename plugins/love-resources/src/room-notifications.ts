import { RoomAccess } from '@hcengineering/love'
import { doNotDisturb } from '@hcengineering/ui'
import { derived } from 'svelte/store'
import { currentRoom } from './stores'

// Room access protects every occupant, independently of personal notification settings.
export const roomNotificationsMuted = derived(
  [doNotDisturb, currentRoom],
  ([personalDnd, room]) => personalDnd || room?.access === RoomAccess.DND
)
