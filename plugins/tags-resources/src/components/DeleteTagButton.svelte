<script lang="ts">
  import { translate } from '@hcengineering/platform'
  import presentation, { getClient } from '@hcengineering/presentation'
  import type { TagElement } from '@hcengineering/tags'
  import { Button, IconCheck, IconDelete, Label, NotificationSeverity, addNotification, themeStore } from '@hcengineering/ui'
  import { createEventDispatcher, onDestroy } from 'svelte'
  import tags from '../plugin'

  export let element: TagElement

  const client = getClient()
  const dispatch = createEventDispatcher()
  let confirming = false
  let deleting = false
  let timeout: ReturnType<typeof setTimeout> | undefined

  onDestroy(() => clearTimeout(timeout))

  async function handleDelete (): Promise<void> {
    if (deleting) return
    if (!confirming) {
      confirming = true
      timeout = setTimeout(() => { confirming = false }, 3000)
      return
    }
    clearTimeout(timeout)
    confirming = false
    deleting = true
    try {
      const references = await client.findAll(tags.class.TagReference, { tag: element._id })
      const ops = client.apply()
      for (const reference of references) {
        await ops.removeCollection(reference._class, reference.space, reference._id,
          reference.attachedTo, reference.attachedToClass, reference.collection)
      }
      await ops.remove(element)
      await ops.commit()
      dispatch('deleted')
      addNotification(await translate(tags.string.TagDeleted, {}, $themeStore.language), element.title,
        Label, { label: tags.string.TagDeleted })
    } catch (error) {
      console.error(error)
      addNotification(await translate(tags.string.TagDeleteFailed, {}, $themeStore.language), element.title,
        Label, { label: tags.string.TagDeleteFailed }, NotificationSeverity.Error)
    } finally {
      deleting = false
    }
  }
</script>

<Button
  icon={confirming ? IconCheck : IconDelete}
  kind={confirming ? 'dangerous' : 'regular'}
  size="small"
  disabled={deleting}
  loading={deleting}
  title={element.title}
  showTooltip={{
    label: confirming ? tags.string.DeleteTagConfirmation : presentation.string.Delete,
    props: { title: element.title }
  }}
  dataId="btnDeleteTag"
  on:click={handleDelete}
/>
