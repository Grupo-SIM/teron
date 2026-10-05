<script lang="ts">
  import { getMetadata } from '@hcengineering/platform'
  import { Button, Notification, NotificationToast } from '@hcengineering/ui'
  import view from '@hcengineering/view'
  import presentation from '@hcengineering/presentation'

  export let onRemove: () => void
  export let notification: Notification

</script>

<NotificationToast title={notification.title} severity={notification.severity} onClose={onRemove}>
  <svelte:fragment slot="content">
    {notification.subTitle}
  </svelte:fragment>
  <svelte:fragment slot="buttons">
    <div style="width: auto" />
    <div class="flex-between gap-2">
      <a href={getMetadata(presentation.metadata.SignupUrl)} target="_blank">
        <Button label={view.string.ReadOnlySignUp} stopPropagation={false} kind="primary" />
      </a>
    </div>
  </svelte:fragment>
</NotificationToast>
