<!--
// Copyright © 2022-2024 Hardcore Engineering Inc.
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
  import { AvatarType } from '@hcengineering/contact'
  import { EditableAvatar, getAccountClient } from '@hcengineering/contact-resources'
  import core from '@hcengineering/core'
  import { openAuthRoute } from '@hcengineering/login'
  import { getClient, MessageBox } from '@hcengineering/presentation'
  import { WorkspaceSetting } from '@hcengineering/setting'
  import {
    Breadcrumb,
    Button,
    EditBox,
    Header,
    IconCheckmark,
    IconClose,
    IconEdit,
    Label,
    Loading,
    Scroller,
    showPopup
  } from '@hcengineering/ui'
  import settingsRes from '../plugin'

  let loading = true
  let isEditingName = false
  let oldName: string
  let name: string = ''

  const accountClient = getAccountClient()
  const disabledSet = ['\n', '<', '>', '/', '\\']

  $: editNameDisabled =
    isEditingName &&
    (name.trim().length > 40 ||
      name.trim() === oldName ||
      name.trim() === '' ||
      disabledSet.some((it) => name.includes(it)))

  void loadWorkspaceName()

  async function loadWorkspaceName (): Promise<void> {
    const res = await accountClient.getWorkspaceInfo()

    oldName = res.name
    name = oldName
    loading = false
  }

  async function handleEditName (): Promise<void> {
    if (editNameDisabled) {
      return
    }

    if (isEditingName) {
      await accountClient.updateWorkspaceName(name.trim())
    }

    isEditingName = !isEditingName
  }

  function handleCancelEditName (): void {
    name = oldName
    isEditingName = false
  }

  async function handleDelete (): Promise<void> {
    showPopup(MessageBox, {
      label: settingsRes.string.DeleteWorkspace,
      message: settingsRes.string.DeleteWorkspaceConfirm,
      dangerous: true,
      action: async () => {
        await accountClient.deleteWorkspace()
        openAuthRoute()
      }
    })
  }

  // Avatar
  let avatarEditor: EditableAvatar
  let workspaceSettings: WorkspaceSetting | undefined = undefined

  const client = getClient()
  void client.findOne(settingsRes.class.WorkspaceSetting, {}).then((r) => {
    workspaceSettings = r
  })

  async function handleAvatarDone (): Promise<void> {
    const existing = await client.findOne(settingsRes.class.WorkspaceSetting, { _id: settingsRes.ids.WorkspaceSetting })
    if (existing !== undefined) {
      const avatar = await avatarEditor.createAvatar()
      // Remove old avatar if changed
      if (existing.icon != null && existing.icon !== avatar.avatar) {
        await avatarEditor.removeAvatar(existing.icon)
      }

      const icon = avatar.avatarType === AvatarType.IMAGE ? avatar.avatar : null
      await client.diffUpdate(existing, { icon })
    } else {
      const avatar = await avatarEditor.createAvatar()

      await client.createDoc(
        settingsRes.class.WorkspaceSetting,
        core.space.Workspace,
        { icon: avatar.avatar },
        settingsRes.ids.WorkspaceSetting
      )
    }
  }

</script>

<div class="teronComponent">
  <Header adaptive={'disabled'}>
    <Breadcrumb icon={settingsRes.icon.Setting} label={settingsRes.string.WorkspaceSettings} size={'large'} isCurrent />
  </Header>
  <div class="teronComponent-content__column content">
    {#if loading}
      <div class="w-full h-full flex-col-center justify-center">
        <Loading />
      </div>
    {:else}
      <Scroller align={'center'} padding={'var(--spacing-3)'} bottomPadding={'var(--spacing-3)'}>
        <div class="teronComponent-content flex-col flex-gap-4">
          <div class="title"><Label label={settingsRes.string.Workspace} /></div>
          <div class="ws">
            <EditableAvatar
              person={{
                avatarType: workspaceSettings?.icon !== undefined ? AvatarType.IMAGE : AvatarType.COLOR,
                avatar: workspaceSettings?.icon
              }}
              size="medium"
              {name}
              bind:this={avatarEditor}
              on:done={handleAvatarDone}
              imageOnly
              lessCrop
            />
            <div class="editBox">
              <EditBox
                bind:value={name}
                placeholder={settingsRes.string.WorkspaceName}
                kind="ghost-large"
                disabled={!isEditingName}
              />
            </div>
            <Button
              icon={isEditingName ? IconCheckmark : IconEdit}
              kind="ghost"
              size="small"
              disabled={editNameDisabled}
              on:click={handleEditName}
            />
            {#if isEditingName}
              <Button icon={IconClose} kind="ghost" size="small" on:click={handleCancelEditName} />
            {/if}
          </div>

          <div class="flex-col flex-gap-4 mt-6">
            <div class="title"><Label label={settingsRes.string.DangerZone} /></div>
            <div class="w-32">
              <Button
                label={settingsRes.string.DeleteWorkspace}
                kind="dangerous"
                on:click={handleDelete}
                showTooltip={{ label: settingsRes.string.DeleteWorkspace }}
              />
            </div>
          </div>
        </div>
      </Scroller>
    {/if}
  </div>
</div>

<style lang="scss">
  .title {
    font-weight: 500;
    font-size: 1rem;
  }
  .ws {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .editBox {
    width: 16rem;
  }
</style>
