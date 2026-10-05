<script lang="ts">
  import { Ref } from '@hcengineering/core'
  import { Card, getClient, SpaceSelector } from '@hcengineering/presentation'
  import templates, { type MessageTemplate, type TemplateCategory } from '@hcengineering/templates'
  import { StyledTextBox } from '@hcengineering/text-editor-resources'
  import { Button, EditBox, Label } from '@hcengineering/ui'
  import { createEventDispatcher } from 'svelte'
  import tracker from '../../plugin'

  const client = getClient()
  const dispatch = createEventDispatcher()

  export let template: MessageTemplate | undefined = undefined

  let title = template?.title ?? ''
  let message = template?.message ?? ''
  let space: Ref<TemplateCategory> = template?.space ?? templates.space.Templates
  $: canSave = title.trim().length > 0 && message.trim().length > 0 && space !== undefined

  export function canClose (): boolean {
    return title === (template?.title ?? '') && message === (template?.message ?? '') &&
      space === (template?.space ?? templates.space.Templates)
  }

  async function createTemplate (): Promise<void> {
    if (!canSave) return
    if (template !== undefined) {
      await client.updateDoc(template._class, template.space, template._id, { title: title.trim(), message, space })
      return
    }
    await client.createDoc<MessageTemplate>(templates.class.MessageTemplate, space, {
      title: title.trim(),
      message
    })
  }
</script>

<Card
  label={template !== undefined ? tracker.string.TextTemplate : tracker.string.NewProcess}
  okAction={createTemplate}
  {canSave}
  okLabel={templates.string.SaveTemplate}
  gap={'gapV-4'}
  on:close={() => dispatch('close')}
  on:changeContent
>
  <svelte:fragment slot="buttons">
    {#if template !== undefined}
      <Button
        label={tracker.string.DiscardTemplate}
        on:click={() => {
          title = template?.title ?? ''
          message = template?.message ?? ''
          space = template?.space ?? templates.space.Templates
          dispatch('close')
        }}
      />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="header">
    <SpaceSelector
      _class={templates.class.TemplateCategory}
      label={templates.string.TemplateCategory}
      bind:space
      kind={'regular'}
      size={'large'}
    />
  </svelte:fragment>
  <svelte:fragment slot="title" let:label>
    <div class="flex-row-center gap-2 pt-1 pb-1 pr-1">
      <span class="overflow-label">
        <Label {label} />
      </span>
    </div>
  </svelte:fragment>

  <EditBox bind:value={title} placeholder={templates.string.TemplatePlaceholder} kind={'large-style'} autoFocus />
  <StyledTextBox alwaysEdit kind={'emphasized'} bind:content={message} maxHeight={'limited'} />
</Card>
