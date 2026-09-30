<!--
// Copyright © 2023 Hardcore Engineering Inc.
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
  import type { NotificationPreferencesGroup } from '@hcengineering/notification'
  import { getResource } from '@hcengineering/platform'
  import { getClient } from '@hcengineering/presentation'
  import {
    Breadcrumb,
    defineSeparators,
    Header,
    NavItem,
    Scroller,
    Separator,
    twoPanelsSeparators
  } from '@hcengineering/ui'

  import notification from '../../plugin'

  const preferencesGroups: NotificationPreferencesGroup[] = getClient()
    .getModel()
    .findAllSync(notification.class.NotificationPreferencesGroup, {})

  let currentPreferenceGroup: NotificationPreferencesGroup | undefined = preferencesGroups[0]

  defineSeparators('notificationSettings', twoPanelsSeparators)
</script>

<div class="teronComponent">
  <Header adaptive={'disabled'}>
    <Breadcrumb
      icon={notification.icon.Notifications}
      label={notification.string.Notifications}
      size={'large'}
      isCurrent
    />
  </Header>
  <div class="teronComponent-content__container columns">
    <div class="teronComponent-content__column navigation py-2">
      <Scroller shrink>
        {#each preferencesGroups as preferenceGroup}
          <NavItem
            icon={preferenceGroup.icon}
            label={preferenceGroup.label}
            selected={preferenceGroup === currentPreferenceGroup}
            on:click={() => (currentPreferenceGroup = preferenceGroup)}
          />
        {/each}
      </Scroller>
    </div>
    <Separator name="notificationSettings" index={0} color={'var(--theme-divider-color)'} />
    <div class="teronComponent-content__column content">
      <Scroller align={'center'} padding={'var(--spacing-3)'} bottomPadding={'var(--spacing-3)'}>
        <div class="teronComponent-content">
          {#if currentPreferenceGroup}
            {#await getResource(currentPreferenceGroup.presenter) then presenter}
              <svelte:component this={presenter} />
            {/await}
          {/if}
        </div>
      </Scroller>
    </div>
  </div>
</div>
