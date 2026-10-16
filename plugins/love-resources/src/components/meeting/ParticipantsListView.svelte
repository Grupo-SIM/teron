<script lang="ts">
  import { aiBotSocialIdentityStore } from '@hcengineering/ai-bot-resources'
  import ParticipantView from './ParticipantView.svelte'
  import { Participant, RemoteParticipant, RoomEvent } from 'livekit-client'
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { liveKitClient, lk } from '../../utils'
  import { infos } from '../../stores'
  import { Ref } from '@hcengineering/core'
  import { Person } from '@hcengineering/contact'
  import { getPersonRefByPersonIdCb } from '@hcengineering/contact-resources'
  import { Room as TypeRoom } from '@hcengineering/love'

  export let room: Ref<TypeRoom>

  const dispatch = createEventDispatcher()

  interface ParticipantData {
    _id: string
    participant: Participant | undefined
    isAgent: boolean
  }

  let aiPersonRef: Ref<Person> | undefined
  $: if ($aiBotSocialIdentityStore != null) {
    getPersonRefByPersonIdCb($aiBotSocialIdentityStore?._id, (ref) => {
      if (ref != null) {
        aiPersonRef = ref
      }
    })
  } else {
    aiPersonRef = undefined
  }

  let participants: ParticipantData[] = []
  let destroyed = false

  function attachParticipant (participant: Participant): void {
    const current = participants.find((p) => p._id === participant.identity)
    if (current !== undefined) {
      current.participant = participant
      participants = participants
      return
    }
    const value: ParticipantData = {
      _id: participant.identity,
      participant,
      isAgent: participant.isAgent
    }
    participants.push(value)
    participants = participants
  }

  function handleParticipantDisconnected (participant: RemoteParticipant): void {
    const index = participants.findIndex((p) => p._id === participant.identity)
    if (index !== -1 && participants[index].participant === participant) {
      if (get(infos).some((info) => info.room === room && info.person === participant.identity)) {
        participants[index].participant = undefined
      } else {
        participants.splice(index, 1)
      }
      participants = participants
    }
  }

  function reconcileParticipants (): void {
    const current = new Map<string, Participant>([
      ...Array.from(lk.remoteParticipants.values(), (participant): [string, Participant] => [participant.identity, participant]),
      [lk.localParticipant.identity, lk.localParticipant]
    ])
    const roomPeople = new Set(get(infos).filter((info) => info.room === room).map((info) => info.person))
    participants = participants.filter((entry) => current.has(entry._id) || roomPeople.has(entry._id as Ref<Person>))
    for (const entry of participants) entry.participant = current.get(entry._id)
    for (const participant of current.values()) attachParticipant(participant)
    participants = participants
  }

  onMount(async () => {
    await liveKitClient.awaitConnect()
    if (destroyed) return
    reconcileParticipants()
    lk.on(RoomEvent.Connected, reconcileParticipants)
    lk.on(RoomEvent.Reconnected, reconcileParticipants)
    lk.on(RoomEvent.ParticipantConnected, attachParticipant)
    lk.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
  })

  onDestroy(
    infos.subscribe((data) => {
      const roomPeople = new Set(data.filter((info) => info.room === room).map((info) => info.person))
      participants = participants.filter((p) => p.participant !== undefined || roomPeople.has(p._id as Ref<Person>))
      for (const info of data) {
        if (info.room !== room) continue
        const current = participants.find((p) => p._id === info.person)
        if (current !== undefined) continue
        const value: ParticipantData = {
          _id: info.person,
          participant: undefined,
          isAgent: info.person === aiPersonRef
        }
        participants.push(value)
      }
      participants = participants
    })
  )

  onDestroy(() => {
    destroyed = true
    lk.off(RoomEvent.Connected, reconcileParticipants)
    lk.off(RoomEvent.Reconnected, reconcileParticipants)
    lk.off(RoomEvent.ParticipantConnected, attachParticipant)
    lk.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
  })

  function getActiveParticipants (participants: ParticipantData[]): ParticipantData[] {
    const result = participants.filter((p) => !p.isAgent || $infos.some(({ person }) => person === p._id))
    dispatch('participantsCount', result.length)
    return result
  }

  $: activeParticipants = getActiveParticipants(participants)
</script>

{#each activeParticipants as participant, i (participant._id)}
  <div class="video">
    <ParticipantView {...participant} {room} />
  </div>
{/each}

<style lang="scss">
  .video {
    min-width: 0;
    min-height: 0;
    flex-shrink: 0;
    aspect-ratio: 16 / 9;
  }
</style>
