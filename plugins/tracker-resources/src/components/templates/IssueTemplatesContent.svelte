<script lang="ts">
  import { type DocumentQuery, type Ref, type Space } from '@hcengineering/core'
  import { createQuery } from '@hcengineering/presentation'
  import templates, { type MessageTemplate } from '@hcengineering/templates'
  import { type IssueTemplate } from '@hcengineering/tracker'
  import { Scroller } from '@hcengineering/ui'
  import tracker from '../../plugin'
  import TemplateRow from './TemplateRow.svelte'

  export let query: DocumentQuery<IssueTemplate> = {}
  export let space: Ref<Space> | undefined
  export let search = ''

  let issues: IssueTemplate[] = []
  let texts: MessageTemplate[] = []
  let issuesPending = true
  let textsPending = true
  const issueQuery = createQuery()
  const textQuery = createQuery()

  $: {
    issuesPending = true
    issueQuery.query(tracker.class.IssueTemplate, { ...query, ...(space !== undefined ? { space } : {}) }, (result) => {
      issues = result
      issuesPending = false
    })
  }
  textQuery.query(templates.class.MessageTemplate, {}, (result) => {
    texts = result
    textsPending = false
  })

  function normalize (value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
  }

  $: items = [...issues, ...texts]
    .filter((item) => normalize(item.title).includes(normalize(search.trim())))
    .sort((a, b) => b.modifiedOn - a.modifiedOn || a._id.localeCompare(b._id))
</script>

<Scroller>
  <div class="flex-col gap-2 p-4">
    {#if issuesPending || textsPending}
      {#each [0, 1, 2] as row (row)}
        <div class="template-skeleton" />
      {/each}
    {:else}
      {#each items as item (item._id)}
        <TemplateRow {item} />
      {/each}
    {/if}
  </div>
</Scroller>

<style lang="scss">
  .template-skeleton {
    height: 3rem;
    border-radius: 0.5rem;
    background: var(--theme-divider-color);
  }
</style>
