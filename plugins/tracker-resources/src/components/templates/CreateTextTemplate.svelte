<script lang="ts">
  import { Ref } from '@hcengineering/core'
  import { Card, getClient, SpaceSelector } from '@hcengineering/presentation'
  import templates, { type MessageTemplate, type TemplateCategory } from '@hcengineering/templates'
  import { StyledTextEditor } from '@hcengineering/text-editor-resources'
  import { EditBox, Label } from '@hcengineering/ui'
  import { createEventDispatcher } from 'svelte'

  const client = getClient()
  const dispatch = createEventDispatcher()

  let title = ''
  let message = ''
  let space: Ref<TemplateCategory> = templates.space.Templates
  $: canSave = title.trim().length > 0 && message.trim().length > 0 && space !== undefined

  export function canClose (): boolean {
    return title.trim() === '' && message.trim() === ''
  }

  async function createTemplate (): Promise<void> {
    if (!canSave) return
    await client.createDoc<MessageTemplate>(templates.class.MessageTemplate, space, {
      title: title.trim(),
      message
    })
  }
</script>

<Card
  label={templates.string.CreateTemplate}
  okAction={createTemplate}
  {canSave}
  okLabel={templates.string.SaveTemplate}
  on:close={() => dispatch('close')}
  on:changeContent
>
  <SpaceSelector _class={templates.class.TemplateCategory} label={templates.string.TemplateCategory} bind:space />
  <EditBox bind:value={title} placeholder={templates.string.TemplatePlaceholder} autoFocus />
  <Label label={templates.string.Message} />
  <StyledTextEditor bind:content={message} maxHeight={'limited'} on:message={(event) => (message = event.detail)} />
</Card>
