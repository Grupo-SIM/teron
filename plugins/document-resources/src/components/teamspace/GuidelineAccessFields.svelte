<script lang="ts">
  import { AccountArrayEditor } from '@hcengineering/contact-resources'
  import core, { type AccountUuid, type ArrOf, type Doc, type RefTo } from '@hcengineering/core'
  import document, { type GuidelineGrants, type Teamspace } from '@hcengineering/document'
  import { getClient } from '@hcengineering/presentation'
  import { Label } from '@hcengineering/ui'
  import { ArrayEditor } from '@hcengineering/view-resources'

  export let grants: GuidelineGrants
  export let teamspace: Teamspace | undefined = undefined
  const client = getClient()
  const object = (teamspace ?? { _class: document.class.Teamspace, space: core.space.Space }) as Doc
  function changePeople (key: 'guidelineReaders' | 'guidelineEditors', refs: AccountUuid[]): void {
    grants = { ...grants, [key]: [...new Set(refs)] }
  }
  function sectorType (key: string): ArrOf<RefTo<Doc>> {
    return client.getHierarchy().getAttribute(document.class.Teamspace, key).type as ArrOf<RefTo<Doc>>
  }
  const people = [
    { key: 'guidelineReaders' as const, label: document.string.GuidelineReaders },
    { key: 'guidelineEditors' as const, label: document.string.GuidelineEditors }
  ]
  const sectors = [
    { key: 'guidelineReaderSectors' as const, label: document.string.GuidelineReaderSectors },
    { key: 'guidelineEditorSectors' as const, label: document.string.GuidelineEditorSectors }
  ]
</script>

{#each people as field (field.key)}
  <div class="antiGrid-row">
    <div class="antiGrid-row__header"><Label label={field.label} /></div>
    <AccountArrayEditor value={grants[field.key] ?? []} label={field.label} kind="regular" size="large"
      onChange={(refs) => changePeople(field.key, refs)} />
  </div>
{/each}
{#each sectors as field (field.key)}
  <div class="antiGrid-row">
    <div class="antiGrid-row__header"><Label label={field.label} /></div>
    <ArrayEditor {object} label={field.label} value={grants[field.key] ?? []}
      type={sectorType(field.key)}
      onChange={(refs) => { grants = { ...grants, [field.key]: [...new Set(refs)] } }} />
  </div>
{/each}
