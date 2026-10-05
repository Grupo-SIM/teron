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
  import contact from '@hcengineering/contact'
  import { containsSearch, Ref, WithLookup } from '@hcengineering/core'
  import type { Department, Staff } from '@hcengineering/hr'
  import { createQuery } from '@hcengineering/presentation'
  import { Button, IconAdd, Label, Scroller, SearchEdit, eventToHTMLElement, showPopup } from '@hcengineering/ui'
  import hr from '../plugin'
  import CreateDepartment from './CreateDepartment.svelte'
  import DepartmentCard from './DepartmentCard.svelte'

  let search = ''
  let departments: Department[] = []

  function showCreateDialog (ev: MouseEvent) {
    showPopup(CreateDepartment, {}, eventToHTMLElement(ev))
  }

  const query = createQuery()
  const spaceMembers = createQuery()

  let descendants: Map<Ref<Department>, Department[]> = new Map<Ref<Department>, Department[]>()
  let allEmployees: WithLookup<Staff>[] = []
  let head: Department | undefined

  query.query(
    hr.class.Department,
    {
      archived: false
    },
    (res) => {
      departments = res
    },
    {
      lookup: {
        teamLead: contact.mixin.Employee
      }
    }
  )

  $: {
    const term = search.trim()
    const byId = new Map(departments.map((department) => [department._id, department]))
    const visible = new Set<Ref<Department>>()
    for (const department of departments) {
      if (term !== '' && !containsSearch(department.name, term) && !containsSearch(department.description, term)) {
        continue
      }
      let current: Department | undefined = department
      while (current !== undefined && !visible.has(current._id)) {
        visible.add(current._id)
        current = current.parent === undefined ? undefined : byId.get(current.parent)
      }
    }
    head = departments.find((department) => department._id === hr.ids.Head && visible.has(department._id))
    descendants = new Map()
    for (const department of departments) {
      if (department.parent !== undefined && visible.has(department._id)) {
        const children = descendants.get(department.parent) ?? []
        children.push(department)
        descendants.set(department.parent, children)
      }
    }
  }

  spaceMembers.query(hr.mixin.Staff, {}, (res) => {
    allEmployees = res
  })
</script>

<div class="ac-header full divide caption-height">
  <div class="ac-header__wrap-title mr-3">
    <span class="ac-header__title"><Label label={hr.string.Structure} /></span>
  </div>

  <div class="mb-1 clear-mins">
    <Button icon={IconAdd} label={hr.string.CreateDepartmentLabel} kind={'primary'} on:click={showCreateDialog} />
  </div>
</div>
<div class="ac-header full divide search-start">
  <div class="ac-header-full small-gap">
    <SearchEdit bind:value={search} />
    <!-- <ActionIcon icon={IconMoreH} size={'small'} /> -->
  </div>
</div>

<Scroller padding={'1rem 2.5rem'}>
  {#if head}
    <DepartmentCard value={head} {descendants} {allEmployees} dragOver={undefined} dragPerson={undefined} />
  {/if}
</Scroller>
