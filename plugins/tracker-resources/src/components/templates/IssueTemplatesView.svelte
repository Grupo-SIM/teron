<script lang="ts">
  import { type DocumentQuery, type Ref, type Space } from '@hcengineering/core'
  import { type IntlString, translate } from '@hcengineering/platform'
  import { type IssueTemplate } from '@hcengineering/tracker'
  import { Breadcrumb, Button, Header, IconAdd, SearchInput, showPopup, themeStore } from '@hcengineering/ui'
  import tracker from '../../plugin'
  import CreateIssueTemplate from './CreateIssueTemplate.svelte'
  import CreateTextTemplate from './CreateTextTemplate.svelte'
  import IssueTemplatesContent from './IssueTemplatesContent.svelte'

  export let space: Ref<Space> | undefined = undefined
  export let query: DocumentQuery<IssueTemplate> = {}
  export let title: IntlString | undefined = undefined
  export let label: string = ''

  let search = ''

  $: if (!label && title) {
    translate(title, {}, $themeStore.language).then((res) => {
      label = res
    })
  }
</script>

<Header adaptive={'default'}>
  {#if $$slots.label_selector}
    <slot name="label_selector" />
  {:else}
    <Breadcrumb icon={tracker.icon.IssueTemplates} title={label} size={'large'} isCurrent />
  {/if}
  <svelte:fragment slot="search">
    <SearchInput bind:value={search} collapsed />
  </svelte:fragment>
  <svelte:fragment slot="actions">
      <Button
        icon={IconAdd}
        label={tracker.string.IssueTemplate}
        kind={'primary'}
        on:click={() => showPopup(CreateIssueTemplate, { targetElement: null, space }, 'top')}
      />
      <Button
        icon={IconAdd}
        label={tracker.string.TextTemplate}
        kind={'primary'}
        on:click={() => showPopup(CreateTextTemplate, {}, 'top')}
      />
  </svelte:fragment>
</Header>
<slot name="afterHeader" />
<IssueTemplatesContent {query} {space} {search} />
