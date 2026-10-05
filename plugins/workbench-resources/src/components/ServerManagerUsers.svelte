<script lang="ts">
  import contact from '@hcengineering/contact'
  import { groupByArray, systemAccountUuid } from '@hcengineering/core'
  import { getMetadata } from '@hcengineering/platform'
  import presentation, { isAdminUser, type OverviewStatistics } from '@hcengineering/presentation'
  import { Button, CheckBox, ticker, Expandable, Label } from '@hcengineering/ui'
  import { FixedColumn, ObjectPresenter } from '@hcengineering/view-resources'
  import { employeeByPersonIdStore } from '@hcengineering/contact-resources'
  import { workspacesStore } from '../utils'
  import workbench from '../plugin'

  const token: string = getMetadata(presentation.metadata.Token) ?? ''
  const endpoint = getMetadata(presentation.metadata.StatsUrl)

  async function fetchStats (time: number): Promise<void> {
    await fetch(endpoint + `/api/v1/overview?token=${token}`, {})
      .then(async (json) => {
        data = await json.json()
      })
      .catch((err) => {
        console.error(err)
      })
  }
  let data: OverviewStatistics | undefined
  $: void fetchStats($ticker)
  let realUsers: boolean
  let showActive5: boolean

  $: byService = groupByArray(
    (data?.workspaces ?? []).filter((it) => !showActive5 || it.sessions.some((sit) => sit.current.tx > 0)),
    (it) => it.service
  )

  const isSystemAccount = (it: string): boolean =>
    it === systemAccountUuid || it === '5a1a5faa-582c-42a6-8613-fc80a15e3ae8' // Hardcoded AiBot account, fix me later!
</script>

<div class="p-6">
  <div class="flex-row-center">
    <Label
      label={workbench.string.UniqueUsers}
      params={{ users: data?.usersTotal ?? 0, connections: data?.connectionsTotal ?? 0 }}
    />
  </div>
  <div class="flex-row-center">
    <CheckBox bind:checked={realUsers} />
    <div class="ml-1"><Label label={workbench.string.ShowOnlyUsers} /></div>
  </div>
  <div class="flex-row-center">
    <CheckBox bind:checked={showActive5} />
    <div class="ml-1"><Label label={workbench.string.ShowActiveFiveMinutes} /></div>
  </div>
</div>
<div class="flex-column p-3 h-full" style:overflow="auto">
  {#each byService.keys() as s}
    {@const ss = byService.get(s) ?? []}
    <Expandable bordered expandable showChevron>
      <svelte:fragment slot="title">
        <div class="flex-row-center p-1">
          <FixedColumn key="service">
            <span class="p-1">
              <Label label={workbench.string.ServiceName} params={{ service: s }} />
            </span>
          </FixedColumn>
          <span class="p-1">
            <Label label={workbench.string.WorkspacesCount} params={{ count: ss.length }} />
          </span>

          <span class="p-1">
            <Label
              label={workbench.string.ConnectionsCount}
              params={{ count: ss.reduce((it, itm) => it + itm.sessions.length, 0) }}
            />
          </span>
          <span class="p-1">
            <Label
              label={workbench.string.UsersCount}
              params={{ count: ss.reduce((it, itm) => it + itm.sessions.filter((it) => !isSystemAccount(it.userId)).length, 0) }}
            />
          </span>
          <span class="p-1">
            <Label
              label={workbench.string.ActiveConnections}
              params={{
                current: ss.reduce((it, itm) => it + itm.sessions.filter((it) => it.current.tx > 0).length, 0),
                recent: ss.reduce((it, itm) => it + itm.sessions.filter((it) => it.mins5.tx > 0 || it.current.tx > 0).length, 0)
              }}
            />
          </span>
        </div>
      </svelte:fragment>
      <div class="p-1">
        {#each ss as act}
          {@const wsInstance = $workspacesStore.find((it) => it.uuid === act.wsId)}
          {@const totalFind = act.sessions.reduce((it, itm) => itm.total.find + it, 0)}
          {@const totalTx = act.sessions.reduce((it, itm) => itm.total.tx + it, 0)}

          {@const currentFind = act.sessions.reduce((it, itm) => itm.current.find + it, 0)}
          {@const currentTx = act.sessions.reduce((it, itm) => itm.current.tx + it, 0)}
          {@const employeeGroups = Array.from(
            new Set(act.sessions.filter((it) => !showActive5 || it.current.tx > 0).map((it) => it.userId))
          ).filter((it) => !isSystemAccount(it) || !realUsers)}
          {@const realGroup = Array.from(new Set(act.sessions.map((it) => it.userId))).filter(
            (it) => !isSystemAccount(it)
          )}
          {#if employeeGroups.length > 0}
            <span class="flex-col">
              <Expandable contentColor expanded={false} expandable={true} bordered>
                <svelte:fragment slot="title">
                  <div class="flex flex-row-center flex-between flex-grow p-1">
                    <div class="fs-title" class:greyed={realGroup.length === 0}>
                      <Label
                        label={workbench.string.WorkspaceConnectionSummary}
                        params={{
                          workspace: wsInstance?.name ?? act.wsId,
                          users: employeeGroups.length,
                          currentFind,
                          currentTx,
                          totalFind,
                          totalTx
                        }}
                      />
                    </div>
                    {#if isAdminUser()}
                      <Button
                        label={workbench.string.ForceClose}
                        size={'small'}
                        kind={'ghost'}
                        on:click={() => {
                          void fetch(
                            endpoint + `/api/v1/manage?token=${token}&operation=force-close&wsId=${act.wsId}`,
                            {
                              method: 'PUT'
                            }
                          )
                        }}
                      />
                    {/if}
                  </div>
                </svelte:fragment>
                <div class="flex-col">
                  {#each employeeGroups as employeeId}
                    {@const personRef = $employeeByPersonIdStore.get(employeeId)?._id}
                    {@const connections = act.sessions.filter((it) => it.userId === employeeId)}

                    {@const find = connections.reduce((it, itm) => itm.current.find + it, 0)}
                    {@const txes = connections.reduce((it, itm) => itm.current.tx + it, 0)}
                    <div class="p-1 flex-col ml-4">
                      <Expandable>
                        <svelte:fragment slot="title">
                          <div class="flex-row-center p-1">
                            {#if personRef}
                              <ObjectPresenter
                                _class={contact.mixin.Employee}
                                objectId={personRef}
                                props={{ shouldShowAvatar: true, disabled: true }}
                              />
                            {:else}
                              {employeeId}
                            {/if}
                            : {connections.length}
                            <div class="ml-4">
                              <div class="ml-1">{find} rx/{txes} tx</div>
                            </div>
                          </div>
                        </svelte:fragment>
                        {#each connections as user, i}
                          <div class="flex-row-center ml-10">
                            #{i}
                            {user.userId}
                            <div class="p-1">
                              <Label
                                label={workbench.string.TotalTransactions}
                                params={{ find: user.total.find, transactions: user.total.tx }}
                              />
                            </div>
                            <div class="p-1">
                              <Label
                                label={workbench.string.PreviousFiveMinutesTransactions}
                                params={{ find: user.mins5.find, transactions: user.mins5.tx }}
                              />
                            </div>
                            <div class="p-1">
                              <Label
                                label={workbench.string.CurrentFiveMinutesTransactions}
                                params={{ find: user.current.find, transactions: user.current.tx }}
                              />
                            </div>
                          </div>
                          <div class="p-1 flex-col ml-10">
                            {#each Object.entries(user.data ?? {}) as [k, v]}
                              <div class="p-1">
                                {k}: {JSON.stringify(v)}
                              </div>
                            {/each}
                          </div>
                        {/each}
                      </Expandable>
                    </div>
                  {/each}
                </div>
              </Expandable>
            </span>
          {/if}
        {/each}
      </div>
    </Expandable>
  {/each}
</div>

<style lang="scss">
  .greyed {
    color: rgba(black, 0.5);
  }
</style>
