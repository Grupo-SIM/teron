<script lang="ts">
  import templates, { type MessageTemplate } from '@hcengineering/templates'
  import { type IssueTemplate } from '@hcengineering/tracker'
  import { Icon, Label, showPanel, showPopup } from '@hcengineering/ui'
  import tracker from '../../plugin'
  import CreateTextTemplate from './CreateTextTemplate.svelte'

  export let item: IssueTemplate | MessageTemplate

  $: isText = item._class === templates.class.MessageTemplate

  function open (): void {
    if (isText) {
      showPopup(CreateTextTemplate, { template: item }, 'top')
    } else {
      showPanel(tracker.component.EditIssueTemplate, item._id, item._class, 'content')
    }
  }
</script>

<button class="template-row flex-row-center gap-3" on:click={open}>
  <Icon icon={isText ? templates.icon.Template : tracker.icon.IssueTemplates} size={'small'} />
  <span class="overflow-label flex-grow text-left">{item.title}</span>
  <span class="text-sm caption-color">
    <Label label={isText ? tracker.string.TextTemplate : tracker.string.IssueTemplate} />
  </span>
</button>

<style lang="scss">
  .template-row {
    width: 100%;
    min-height: 3rem;
    padding: 0.75rem;
    border: 1px solid var(--theme-divider-color);
    border-radius: 0.5rem;
    background: var(--theme-panel-color);
    color: var(--theme-content-color);
    cursor: pointer;

    &:hover {
      background: var(--theme-button-hovered);
    }
  }
</style>
