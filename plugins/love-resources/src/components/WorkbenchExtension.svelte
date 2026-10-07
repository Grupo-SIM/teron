<script lang="ts">
  import { pushRootBarComponent } from '@hcengineering/ui'
  import { RemoteParticipant, RemoteTrack, RemoteTrackPublication, RoomEvent, Track } from 'livekit-client'
  import { onDestroy, onMount } from 'svelte'
  import love from '../plugin'
  import { liveKitClient, lk } from '../utils'
  import { lkSessionConnected } from '../liveKitClient'
  import { subscribeInviteRequests, unsubscribeInviteRequests } from '../invites'
  import { Room } from '@hcengineering/love'
  import { subscribeJoinRequests, unsubscribeJoinRequests } from '../joinRequests'
  import { Ref } from '@hcengineering/core'
  import { myInfo } from '../stores'
  import { RemoteAudio } from '../remote-audio'

  let parentElement: HTMLDivElement
  let audio: RemoteAudio | undefined

  function handleTrackSubscribed (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    _participant: RemoteParticipant
  ): void {
    if (track.kind === Track.Kind.Audio) {
      audio?.attach(track)
    }
  }

  function handleTrackUnsubscribed (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    _participant: RemoteParticipant
  ): void {
    if (track.kind === Track.Kind.Audio) {
      audio?.detach(track)
    }
  }

  function reconcileAudio (): void {
    const tracks: RemoteTrack[] = []
    for (const participant of lk.remoteParticipants.values()) {
      for (const publication of participant.audioTrackPublications.values()) {
        if (publication.track !== undefined) tracks.push(publication.track)
      }
    }
    audio?.reconcile(tracks)
  }

  function subscribeRoomRequests (room: Ref<Room> | undefined): void {
    unsubscribeJoinRequests()
      .then(() => subscribeJoinRequests(room))
      .catch((e) => {
        console.log(e)
      })
  }

  $: subscribeRoomRequests($myInfo?.room)

  onMount(async () => {
    audio = new RemoteAudio(parentElement)
    pushRootBarComponent('left', love.component.ControlExt, 20)
    lk.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
    lk.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
    lk.on(RoomEvent.Connected, reconcileAudio)
    lk.on(RoomEvent.Reconnected, reconcileAudio)
    reconcileAudio()

    await subscribeInviteRequests()
  })

  onDestroy(async () => {
    lk.off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
    lk.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
    lk.off(RoomEvent.Connected, reconcileAudio)
    lk.off(RoomEvent.Reconnected, reconcileAudio)
    audio?.clear()
    audio = undefined
    await unsubscribeInviteRequests()
    if ($lkSessionConnected) {
      await liveKitClient.disconnect()
    }
  })
</script>

<div bind:this={parentElement} class="hidden"></div>
