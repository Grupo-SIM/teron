<!--
// Copyright © 2022 Hardcore Engineering Inc.
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
  import { DocumentQuery, WithLookup } from '@hcengineering/core'
  import { IntlString } from '@hcengineering/platform'
  import { Milestone } from '@hcengineering/tracker'
  import { Button, IconAdd, SearchInput, showPopup, Header, Breadcrumbs } from '@hcengineering/ui'
  import { ViewOptions, Viewlet } from '@hcengineering/view'
  import { FilterBar, FilterButton, ViewletSelector, ViewletSettingButton } from '@hcengineering/view-resources'
  import tracker from '../../plugin'
  import MilestoneContent from './MilestoneContent.svelte'
  import NewMilestone from './NewMilestone.svelte'

  export let label: IntlString
  export let query: DocumentQuery<Milestone> = {}
  export let search: string = ''

  const space = typeof query.space === 'string' ? query.space : tracker.project.DefaultProject
  const showCreateDialog = async () => {
    showPopup(NewMilestone, { space, targetElement: null }, 'top')
  }

  export let panelWidth: number = 0

  let viewlet: WithLookup<Viewlet> | undefined = undefined
  let viewOptions: ViewOptions | undefined

  let searchQuery: DocumentQuery<Milestone> = { ...query }
  function updateSearchQuery (search: string): void {
    searchQuery = search === '' ? { ...query } : { ...query, $search: search }
  }
  $: if (query) updateSearchQuery(search)

  let resultQuery: DocumentQuery<Milestone> = { ...searchQuery }

  let asideFloat: boolean = false
  let asideShown: boolean = true
  $: if (panelWidth < 900 && !asideFloat) asideFloat = true
  $: if (panelWidth >= 900 && asideFloat) {
    asideFloat = false
    asideShown = false
  }

</script>

<Header adaptive={'doubleRow'}>
  <svelte:fragment slot="beforeTitle">
    <ViewletSelector viewletQuery={{ attachTo: tracker.class.Milestone }} bind:viewlet />
    <ViewletSettingButton bind:viewOptions bind:viewlet />
  </svelte:fragment>

  <Breadcrumbs items={[{ icon: tracker.icon.Milestone, label }]} />

  <svelte:fragment slot="search">
    <SearchInput bind:value={search} collapsed />
    <FilterButton _class={tracker.class.Milestone} {space} />
  </svelte:fragment>
  <svelte:fragment slot="actions">
    <Button icon={IconAdd} label={tracker.string.Milestone} kind={'primary'} on:click={showCreateDialog} />
  </svelte:fragment>
</Header>
<FilterBar
  _class={tracker.class.Milestone}
  query={searchQuery}
  {space}
  {viewOptions}
  on:change={(e) => (resultQuery = e.detail)}
/>
{#if viewlet && viewOptions}
  <MilestoneContent {viewlet} query={resultQuery} {space} {viewOptions} />
{/if}
