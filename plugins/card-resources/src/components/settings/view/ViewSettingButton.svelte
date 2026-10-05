<!--
// Copyright © 2025 Hardcore Engineering Inc.
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
  import { Viewlet } from '@hcengineering/view'
  import { Data } from '@hcengineering/core'
  import ViewOptionsButton from './ViewOptionsButton.svelte'

  export let kind: 'primary' | 'secondary' | 'tertiary' | 'negative' = 'secondary'
  export let viewlet: Data<Viewlet> | undefined = undefined
</script>

{#if viewlet?.viewOptions !== undefined}
  <ViewOptionsButton {viewlet} {kind} />
{/if}
