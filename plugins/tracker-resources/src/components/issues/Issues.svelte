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
  import { DocumentQuery, Ref } from '@hcengineering/core'
  import type { Asset, IntlString } from '@hcengineering/platform'
  import { Issue, Project } from '@hcengineering/tracker'
  import view, { Viewlet } from '@hcengineering/view'

  import { TypeSelector, selectedTaskTypeStore, selectedTypeStore, taskTypeStore } from '@hcengineering/task-resources'
  import tracker from '../../plugin'
  import IssuesView from './IssuesView.svelte'


  export let currentSpace: Ref<Project> | undefined = undefined
  export let baseQuery: DocumentQuery<Issue> = {}
  export let title: IntlString
  export let icon: Asset | undefined = undefined
  export let allProjectsTypes: boolean = false

  export let baseClass = tracker.class.Issue

  $: spaceQuery = currentSpace !== undefined ? { space: currentSpace } : {}

  $: allTypes = Array.from($taskTypeStore.values())
    .filter((it) => it.parent === $selectedTypeStore)
    .map((it) => it._id)

  $: finalQuery = {
    ...baseQuery,
    ...spaceQuery,
    ...(allProjectsTypes
      ? {}
      : $selectedTaskTypeStore !== undefined
        ? { kind: $selectedTaskTypeStore }
        : { kind: { $in: allTypes } })
  }

  const toVL = (data: any): Viewlet | undefined => data as Viewlet
</script>

<IssuesView query={finalQuery} space={currentSpace} {icon} {title}>
    <svelte:fragment slot="type_selector" let:viewlet>
      {#if !allProjectsTypes}
        <TypeSelector {baseClass} project={currentSpace} allTypes={toVL(viewlet)?.descriptor === view.viewlet.List} />
      {/if}
    </svelte:fragment>
</IssuesView>
