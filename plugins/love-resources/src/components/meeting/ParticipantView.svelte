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
  import { formatName, Person } from '@hcengineering/contact'
  import { Avatar, getPersonByPersonRefStore } from '@hcengineering/contact-resources'
  import { Ref } from '@hcengineering/core'
  import { Loading } from '@hcengineering/ui'
  import MicDisabled from '../icons/MicDisabled.svelte'
  import { onDestroy, onMount } from 'svelte'
  import {
    ChatMessage,
    ConnectionQuality,
    LocalParticipant,
    Participant,
    ParticipantEvent,
    RemoteParticipant,
    type RemoteTrack,
    RoomEvent,
    Track
  } from 'livekit-client'
  import BadConnection from '../icons/BadConnection.svelte'
  import { lk } from '../../utils'
  import Reaction from './Reaction.svelte'
  import { Room } from '@hcengineering/love'
  import KickParticipantButton from '../KickParticipantButton.svelte'
  import { getParticipantMedia } from '../../participant-media'

  export let room: Ref<Room>
  export let _id: string
  export let participant: Participant | undefined = undefined

  let parent: HTMLDivElement
  let mirror: boolean

  let activeParticipant: Participant | undefined = undefined
  let videoTrack: Track | undefined = undefined
  let videoTrackElement: HTMLMediaElement | undefined = undefined
  let videoMuted: boolean = true
  let microphoneMuted: boolean = true
  let isSpeaking: boolean = false
  let isBadConnection: boolean = false

  $: personRef = _id as Ref<Person>
  $: personByRefStore = getPersonByPersonRefStore([personRef])
  $: user = $personByRefStore.get(personRef)
  $: userName = (user !== undefined ? user.name : activeParticipant?.name) ?? ''

  function attachTrack (track: Track): void {
    if (parent == null) return
    detachCurrentTrack()

    videoTrack = track
    videoTrackElement = track.attach()
    const enabled = activeParticipant?.isCameraEnabled ?? false

    videoTrackElement.classList.add('video')
    if (!enabled) videoTrackElement.classList.add('hidden')
    parent.appendChild(videoTrackElement)
    videoMuted = !enabled
  }

  function detachCurrentTrack (): void {
    if (videoTrackElement !== undefined) {
      videoTrack?.detach(videoTrackElement)
      videoTrackElement.remove()
    }
    videoTrack = undefined
    videoTrackElement = undefined
    videoMuted = true
  }

  function setTrackMuted (value: boolean): void {
    if (videoTrackElement !== undefined) {
      if (value) {
        videoTrackElement.classList.add('hidden')
      } else {
        videoTrackElement.classList.remove('hidden')
      }
    }
    videoMuted = value
  }

  function speachHandler (speaking: boolean): void {
    isSpeaking = speaking
  }

  function reconcileParticipantMedia (): void {
    updateParticipantMedia()
  }

  function onTrackUnsubscribed (track: RemoteTrack): void {
    // LiveKit emits this event before clearing the publication track.
    updateParticipantMedia(track)
  }

  function updateParticipantMedia (unsubscribedTrack?: Track): void {
    const media = getParticipantMedia(activeParticipant, unsubscribedTrack)
    microphoneMuted = media.microphoneMuted
    if (media.cameraTrack !== videoTrack) {
      if (media.cameraTrack === undefined) {
        detachCurrentTrack()
      } else {
        attachTrack(media.cameraTrack)
      }
    }
    setTrackMuted(media.cameraMuted)
  }

  function onConnectionQualityChanged (quality: ConnectionQuality): void {
    isBadConnection = quality === ConnectionQuality.Lost || quality === ConnectionQuality.Poor
  }

  function detachParticipant (): void {
    if (activeParticipant === undefined) return
    activeParticipant.off(ParticipantEvent.TrackMuted, reconcileParticipantMedia)
    activeParticipant.off(ParticipantEvent.TrackUnmuted, reconcileParticipantMedia)
    activeParticipant.off(ParticipantEvent.IsSpeakingChanged, speachHandler)
    activeParticipant.off(ParticipantEvent.ConnectionQualityChanged, onConnectionQualityChanged)
    if (activeParticipant.isLocal) {
      activeParticipant.off(ParticipantEvent.LocalTrackPublished, reconcileParticipantMedia)
      activeParticipant.off(ParticipantEvent.LocalTrackUnpublished, reconcileParticipantMedia)
    } else {
      activeParticipant.off(ParticipantEvent.TrackPublished, reconcileParticipantMedia)
      activeParticipant.off(ParticipantEvent.TrackUnpublished, reconcileParticipantMedia)
      activeParticipant.off(ParticipantEvent.TrackSubscribed, reconcileParticipantMedia)
      activeParticipant.off(ParticipantEvent.TrackUnsubscribed, onTrackUnsubscribed)
    }
    activeParticipant = undefined
  }

  function onChatMessage (message: ChatMessage, participant?: RemoteParticipant | LocalParticipant | undefined): void {
    if (activeParticipant !== participant) return
    reactions = [
      ...reactions,
      {
        id: message.id,
        emoji: message.message,
        width: parent.offsetWidth,
        height: parent.offsetHeight
      }
    ]
  }

  let reactions: Array<{ id: string, emoji: string, height: number, width: number }> = []

  function setParticipant (p: Participant | undefined): void {
    if (parent == null) return
    if (activeParticipant === p) return

    detachParticipant()
    detachCurrentTrack()

    activeParticipant = p
    isSpeaking = false
    isBadConnection = false
    microphoneMuted = true
    if (p === undefined) return

    mirror = p.isLocal
    reconcileParticipantMedia()

    p.on(ParticipantEvent.TrackMuted, reconcileParticipantMedia)
    p.on(ParticipantEvent.TrackUnmuted, reconcileParticipantMedia)
    p.on(ParticipantEvent.IsSpeakingChanged, speachHandler)
    p.on(ParticipantEvent.ConnectionQualityChanged, onConnectionQualityChanged)

    if (p.isLocal) {
      p.on(ParticipantEvent.LocalTrackPublished, reconcileParticipantMedia)
      p.on(ParticipantEvent.LocalTrackUnpublished, reconcileParticipantMedia)
    } else {
      p.on(ParticipantEvent.TrackPublished, reconcileParticipantMedia)
      p.on(ParticipantEvent.TrackUnpublished, reconcileParticipantMedia)
      p.on(ParticipantEvent.TrackSubscribed, reconcileParticipantMedia)
      p.on(ParticipantEvent.TrackUnsubscribed, onTrackUnsubscribed)
    }
  }

  $: setParticipant(participant)

  onDestroy(() => {
    lk.off(RoomEvent.ChatMessage, onChatMessage)
    lk.off(RoomEvent.Reconnected, reconcileParticipantMedia)
    detachParticipant()
    detachCurrentTrack()
  })

  onMount(() => {
    lk.on(RoomEvent.ChatMessage, onChatMessage)
    lk.on(RoomEvent.Reconnected, reconcileParticipantMedia)
    setParticipant(participant)
  })
</script>

<div id={_id} class="parent" class:speach={isSpeaking}>
  <div bind:this={parent} class="cover" class:active={!videoMuted} class:mirror={mirror && !videoMuted} />
  <div class="ava">
    <Avatar size={'full'} name={userName} person={user} showStatus={false} />
  </div>
  <div class="label" class:withIcon={microphoneMuted || isBadConnection || participant === undefined}>
    {#if participant === undefined}<Loading size={'small'} shrink />{/if}
    {#if isBadConnection}<BadConnection fill={'var(--bg-negative-default)'} size={'small'} />{/if}
    {#if microphoneMuted}<MicDisabled fill={'var(--bg-negative-default)'} size={'small'} />{/if}
    <span class="overflow-label">{formatName(userName)}</span>
  </div>
  <div class="participant-actions">
    <KickParticipantButton person={personRef} {room} />
  </div>
  {#each reactions as reaction (reaction.id)}
    <Reaction
      {...reaction}
      on:complete={() => {
        reactions = reactions.filter((it) => it !== reaction)
      }}
    />
  {/each}
</div>

<style lang="scss">
  :global(.video) {
    object-fit: cover;
    border-radius: 0.75rem;
    width: 100%;
  }
  :global(.hidden) {
    display: none;
  }
  .cover :global(video.video) {
    height: 100%;
  }
  .cover {
    overflow: hidden;
    object-fit: cover;
    border-radius: 0.75rem;
    height: 100%;
    width: 100%;
    aspect-ratio: 1280 / 720;
    display: flex;
    justify-content: center;
    align-items: center;

    &.mirror {
      transform: scaleX(-1);
    }

    &.active + .ava {
      display: none;
    }
    &:not(.active) {
      background-color: black;
    }
  }
  .ava {
    overflow: hidden;
    position: absolute;
    top: 50%;
    left: 50%;
    height: 50%;
    aspect-ratio: 1;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  .participant-actions {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 2;
    border-radius: 0.5rem;
    background-color: rgba(0, 0, 0, 0.5);
  }
  .parent {
    position: relative;
    flex-shrink: 0;
    height: 100%;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
    background-color: black;
    border-radius: 0.75rem;

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      position: absolute;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      top: 0.25rem;
      left: 0.25rem;
      max-width: 12rem;
      font-weight: 500;
      font-size: 0.75rem;
      line-height: 1rem;
      color: var(--white-color);
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 0.5rem;
      backdrop-filter: blur(3px);

      &.withIcon {
        padding-left: 0.25rem;
      }
    }
    &.speach::before,
    &.speach::after {
      position: absolute;
      content: '';
      inset: 0;
      border-radius: 0.75rem;
      z-index: 1;
      pointer-events: none;
    }
    &.speach::before {
      border: 3px solid var(--border-talk-indication-secondary);
    }
    &.speach::after {
      border: 2px solid var(--border-talk-indication-primary);
    }
  }
</style>
