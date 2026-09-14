<script lang="ts">
  import { AnyAttribute, Class, Doc, Ref } from '@hcengineering/core'
  import { IntlString } from '@hcengineering/platform'
  import { createQuery, getClient } from '@hcengineering/presentation'
  import tags, { TagElement, TagReference, TagsEvents } from '@hcengineering/tags'
  import { Icon, Label, getEventPopupPositionElement, showPopup } from '@hcengineering/ui'
  import { getObjectId } from '@hcengineering/view-resources'
  import { Analytics } from '@hcengineering/analytics'

  import TagReferencePresenter from './TagReferencePresenter.svelte'
  import TagsPopup from './TagsPopup.svelte'
  import TagIcon from './icons/TagIcon.svelte'

  export let object: Doc
  export let label: IntlString = tags.string.AddLabel
  export let readonly: boolean = false
  export let attribute: AnyAttribute | undefined = undefined
  export let attributeKey = 'labels'

  let items: TagReference[] = []
  const query = createQuery()
  const client = getClient()
  const hierarchy = client.getHierarchy()

  $: targetClass = (attribute?.attributeOf as Ref<Class<Doc>> | undefined) ?? object._class

  $: query.query(
    tags.class.TagReference,
    { attachedTo: object._id, attachedToClass: targetClass, collection: attributeKey },
    (result) => {
      items = result
    }
  )
  async function tagsHandler (evt: MouseEvent): Promise<void> {
    if (readonly) return
    showPopup(
      TagsPopup,
      { targetClass, selected: items.map((item) => item.tag) },
      getEventPopupPositionElement(evt),
      undefined,
      async (result) => {
        if (result === undefined) return
        if (result.action === 'add') {
          await addTag(result.tag)
        } else if (result.action === 'remove') {
          const reference = items.find((item) => item.tag === result.tag._id)
          if (reference !== undefined) await removeTag(reference)
        }
      },
      {
        refId: 'TagsPopup',
        category: 'popup',
        overlay: true
      }
    )
  }
  async function addTag ({ title, color, _id: tag }: TagElement): Promise<void> {
    await client.addCollection(tags.class.TagReference, object.space, object._id, targetClass, attributeKey, {
      title,
      color,
      tag
    })
  }
  async function removeTag (tag: TagReference): Promise<void> {
    if (tag !== undefined) {
      await client.removeCollection(tags.class.TagReference, object.space, tag._id, object._id, targetClass, attributeKey)
      const id = await getObjectId(object, hierarchy)
      Analytics.handleEvent(TagsEvents.TagRemoved, { object: id })
    }
  }
</script>

{#if items.length}
  <div class="flex-row-center flex-wrap">
    {#each items as value}
      <div class="step-container clear-mins">
        <TagReferencePresenter
          attr={attribute}
          {value}
          isEditable={!readonly}
          kind={'list'}
          on:remove={(res) => removeTag(res.detail)}
        />
      </div>
    {/each}
    {#if !readonly}
      <div class="step-container clear-mins">
        <button class="tag-button" on:click|stopPropagation={tagsHandler}>
          <div class="icon"><Icon icon={TagIcon} size={'full'} /></div>
          <span class="overflow-label label"><Label {label} /></span>
        </button>
      </div>
    {/if}
  </div>
{:else if !readonly}
  <button class="tag-button" style="width: min-content" on:click|stopPropagation={tagsHandler}>
    <div class="icon"><Icon icon={TagIcon} size={'full'} /></div>
    <span class="overflow-label label"><Label {label} /></span>
  </button>
{/if}

<style lang="scss">
  .step-container {
    margin: 0.375rem 0.375rem 0 0;
  }
  .tag-button {
    overflow: hidden;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding: 0 0.625rem 0 0.5rem;
    height: 2rem;
    min-width: 0;
    min-height: 0;
    color: var(--theme-content-color);
    border: 1px solid transparent;
    border-radius: 1rem;

    .icon {
      flex-shrink: 0;
      width: 1rem;
      height: 1rem;
    }
    .label {
      margin-left: 0.25rem;
    }
    &:hover {
      color: var(--theme-caption-color);
      border-color: var(--theme-divider-color);
    }
  }
</style>
