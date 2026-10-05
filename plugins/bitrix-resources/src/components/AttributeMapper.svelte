<script lang="ts">
  import { BitrixEntityMapping, BitrixFieldMapping, MappingOperation, Fields } from '@hcengineering/bitrix'
  import core, { AnyAttribute } from '@hcengineering/core'
  import { getClient } from '@hcengineering/presentation'
  import { Button, eventToHTMLElement, IconDelete, Menu, showPopup, Action, IconEdit } from '@hcengineering/ui'
  import bitrix from '../plugin'
  import CreateMappingAttribute from './CreateMappingAttribute.svelte'
  export let mapping: BitrixEntityMapping
  export let fieldMapping: BitrixFieldMapping[]
  export let fields: Fields
  export let attribute: AnyAttribute

  $: mappedField = fieldMapping.find((it) => it.attributeName === attribute.name)

  const client = getClient()

  const allowed = new Set([
    core.class.TypeString,
    core.class.TypeMarkup,
    core.class.TypeBoolean,
    core.class.TypeDate,
    core.class.TypeNumber,
    core.class.TypeFileSize,
    core.class.EnumOf,
    core.class.Collection,
    core.class.ArrOf,
    core.class.RefTo
  ])

  function addMapping (evt: MouseEvent, kind: MappingOperation): void {
    showPopup(
      CreateMappingAttribute,
      {
        mapping,
        attribute,
        fields,
        kind
      },
      'middle'
    )
  }

  $: actions = [
    {
      label: bitrix.string.AddCopyMapping,
      action: (_: any, evt: MouseEvent) => {
        addMapping(evt, MappingOperation.CopyValue)
      }
    },
    {
      label: bitrix.string.AddTagMapping,
      action: (_: any, evt: MouseEvent) => {
        addMapping(evt, MappingOperation.CreateTag)
      }
    },
    {
      label: bitrix.string.AddChannelMapping,
      action: (_: any, evt: MouseEvent) => {
        addMapping(evt, MappingOperation.CreateChannel)
      }
    },
    {
      label: bitrix.string.AddDownloadAttachmentMapping,
      action: (_: any, evt: MouseEvent) => {
        addMapping(evt, MappingOperation.DownloadAttachment)
      }
    },
    {
      label: bitrix.string.AddFieldReferenceMapping,
      action: (_: any, evt: MouseEvent) => {
        addMapping(evt, MappingOperation.FindReference)
      }
    },
    {
      label: bitrix.string.CreateVacancyAndApplication,
      action: (_: any, evt: MouseEvent) => {
        addMapping(evt, MappingOperation.CreateHRApplication)
      }
    }
  ] as Action[]
</script>

<div class="flex-row-center">
  {#if mappedField !== undefined}
    <Button
      icon={IconEdit}
      on:click={(evt) => {
        showPopup(
          CreateMappingAttribute,
          {
            mapping,
            attribute,
            fields,
            field: mappedField
          },
          'middle'
        )
      }}
    />
    <Button
      icon={IconDelete}
      on:click={() => {
        if (mappedField) {
          client.remove(mappedField)
        }
      }}
    />
  {:else if allowed.has(attribute.type._class)}
    <Button
      label={bitrix.string.MapField}
      on:click={(evt) => {
        showPopup(
          Menu,
          {
            actions
          },
          eventToHTMLElement(evt)
        )
      }}
    />
  {/if}
</div>
