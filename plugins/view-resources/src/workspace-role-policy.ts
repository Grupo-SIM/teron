import { AccountRole, hasAccountRole, type Account } from '@hcengineering/core'

// Class IDs avoid coupling the shared view package to every application plugin.
const memberContent = new Set([
  'document:class:Document',
  'calendar:class:Event',
  'calendar:class:Calendar',
  'calendar:class:Schedule',
  'time:class:ToDo'
])
const memberFields: Record<string, string[]> = {
  'document:class:Document': ['title', 'content', 'icon', 'color', 'space', 'parent', 'rank'],
  'calendar:class:Calendar': ['name', 'hidden', 'visibility'],
  'calendar:class:Schedule': ['title', 'description', 'meetingDuration', 'meetingInterval', 'availability', 'timeZone', 'calendar'],
  'calendar:class:Event': ['title', 'description', 'date', 'dueDate', 'allDay', 'timeZone', 'visibility', 'participants', 'externalParticipants', 'location', 'reminders', 'rules', 'rdate', 'exdate', 'isCancelled'],
  'time:class:ToDo': ['title', 'description', 'doneOn', 'priority', 'visibility', 'rank']
}

/** Workspace role ceiling; ownership and per-space permissions still apply separately. */
export function canMutateWorkspaceClass (
  account: Account,
  ancestors: readonly string[],
  operation: 'create' | 'update' | 'remove',
  field?: string
): boolean {
  if (ancestors.includes('task:class:Task')) return true
  if (hasAccountRole(account, AccountRole.Maintainer)) return true
  if (!hasAccountRole(account, AccountRole.User)) return false
  if (ancestors.includes('drive:class:Folder')) return operation === 'create' || operation === 'remove'
  if (ancestors.includes('drive:class:Folder')) return operation === 'create' || operation === 'remove'
  const content = ancestors.find((id) => memberContent.has(id))
  if (content === undefined) return false
  if (operation === 'remove' && content === 'calendar:class:Calendar') return false
  return field === undefined || memberFields[content].includes(field)
}
