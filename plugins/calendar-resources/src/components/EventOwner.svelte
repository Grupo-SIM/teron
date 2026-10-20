<script lang="ts">
  import { getName } from '@hcengineering/contact'
  import { getPersonByPersonIdStore } from '@hcengineering/contact-resources'
  import type { PersonId } from '@hcengineering/core'
  import { getClient } from '@hcengineering/presentation'

  export let user: PersonId

  const hierarchy = getClient().getHierarchy()

  $: persons = getPersonByPersonIdStore([user])
  $: owner = $persons.get(user)
</script>

{#if owner}
  <span class="content-dark-color"> — {getName(hierarchy, owner)}</span>
{/if}
