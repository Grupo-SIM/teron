<script lang="ts">
  import { createQuery, MessageViewer } from '@hcengineering/presentation'
  import templates, { type MessageTemplate } from '@hcengineering/templates'
  import { Button, Scroller } from '@hcengineering/ui'

  export let search: string = ''

  let items: MessageTemplate[] = []
  let selected: MessageTemplate | undefined

  const query = createQuery()
  $: query.query(
    templates.class.MessageTemplate,
    search.trim() === '' ? {} : { $search: search },
    (result) => {
      items = result
      selected = result.find((item) => item._id === selected?._id) ?? result[0]
    }
  )
</script>

<div class="flex flex-grow min-h-0">
  <div class="template-list">
    <Scroller>
      <div class="flex-col gap-2 p-4">
        {#each items as item (item._id)}
          <Button
            label={item.title}
            kind={selected?._id === item._id ? 'primary' : 'secondary'}
            on:click={() => (selected = item)}
          />
        {/each}
      </div>
    </Scroller>
  </div>
  {#if selected}
    <div class="flex-grow p-4">
      <h2>{selected.title}</h2>
      <MessageViewer message={selected.message} />
    </div>
  {/if}
</div>

<style lang="scss">
  .template-list {
    width: 16rem;
    flex-shrink: 0;
    border-right: 1px solid var(--theme-divider-color);
  }
</style>
