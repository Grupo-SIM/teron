<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { liveKitClient, lk } from '../../utils'
  import { bindScreenShareView } from './screen-share-view'

  export let hasActiveTrack: boolean = false
  export let showLocalTrack: boolean = true

  let screen: HTMLVideoElement
  let destroyed = false
  let view: ReturnType<typeof bindScreenShareView> | undefined

  $: if (view !== undefined) {
    showLocalTrack
    view.reconcile()
  }

  onMount(() => {
    void liveKitClient.awaitConnect().then(() => {
      if (destroyed) return
      view = bindScreenShareView(lk, screen, () => showLocalTrack, (active) => { hasActiveTrack = active })
    })
  })

  onDestroy(() => {
    destroyed = true
    view?.destroy()
  })
</script>

<video class="screen" bind:this={screen}></video>

<style lang="scss">
  .screen {
    object-fit: contain;
    max-width: 100%;
    max-height: 100%;
    height: 100%;
    width: 100%;
    border-radius: 0.75rem;
  }
</style>
