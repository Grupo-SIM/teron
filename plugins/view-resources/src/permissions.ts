import { getCurrentEmployee, type PermissionsStore } from '@hcengineering/contact'
import core, {
  AccountRole,
  getCurrentAccount,
  hasAccountRole,
  type AnyAttribute,
  type Class,
  type Doc,
  type Permission,
  type Ref,
  type SocialId,
  type Space,
  type TypedSpace
} from '@hcengineering/core'
import { getMetadata } from '@hcengineering/platform'
import { getClient } from '@hcengineering/presentation'
import task from '@hcengineering/task'
import { canMutateWorkspaceClass } from './workspace-role-policy'

export function canChangeAttribute (
  attr: AnyAttribute,
  space: Ref<TypedSpace>,
  store: PermissionsStore,
  _class: Ref<Class<Doc>>,
  object?: Doc
): boolean {
  const account = getCurrentAccount()
  const ancestors = getClient().getHierarchy().getAncestors(_class)
  if (!ancestors.includes(task.class.Task) && !hasAccountRole(account, AccountRole.Maintainer)) {
    if (!hasAccountRole(account, AccountRole.User)) return false
    if (ancestors.includes('document:class:Document' as Ref<Class<Doc>>) && object !== undefined && (object as Doc & { lockedBy?: unknown }).lockedBy != null) return false
    if (ancestors.some((id) => ['calendar:class:Event', 'calendar:class:Calendar', 'calendar:class:Schedule', 'time:class:ToDo'].includes(id))) {
      if (object === undefined) return false
      const personal = object as Doc & { user?: string, owner?: string }
      const own = ancestors.includes('calendar:class:Schedule' as Ref<Class<Doc>>)
        ? personal.owner === getCurrentEmployee()
        : personal.user === getCurrentEmployee() || account.socialIds.includes(personal.user as SocialId)
      if (!own) return false
    }
  }
  if (!canMutateWorkspaceClass(account, ancestors, 'update', attr.name)) return false
  const arePermissionsDisabled = getMetadata(core.metadata.DisablePermissions) ?? false
  if (arePermissionsDisabled) return true
  if (store.whitelist.has(space)) return true
  const forbiddenId = `${attr._id}_forbidden` as Ref<Permission>
  const forbidden = store.ps[space]?.has(forbiddenId)
  if (forbidden) {
    return false
  }
  const allowedId = `${attr._id}_allowed` as Ref<Permission>
  const allowed = store.ps[space]?.has(allowedId)
  if (allowed) {
    return true
  }

  const target = attr.attributeOf
  const forbiddenClId = `${target}_forbidden` as Ref<Permission>
  const forbiddenCl = store.ps[space]?.has(forbiddenClId)
  if (forbiddenCl) {
    return false
  }
  const allowedClId = `${target}_allowed` as Ref<Permission>
  const allowedCl = store.ps[space]?.has(allowedClId)
  if (allowedCl) {
    return true
  }

  return canChangeDoc(_class, space, store)
}

export function canChangeDoc (_class: Ref<Class<Doc>>, space: Ref<Space>, store: PermissionsStore): boolean {
  if (!canMutateWorkspaceClass(getCurrentAccount(), getClient().getHierarchy().getAncestors(_class), 'update')) return false
  const arePermissionsDisabled = getMetadata(core.metadata.DisablePermissions) ?? false
  if (arePermissionsDisabled) return true
  if (store.whitelist.has(space)) return true
  if (store.ps[space] !== undefined) {
    const forbiddenClId = `${_class}_forbidden` as Ref<Permission>
    const forbiddenCl = store.ps[space]?.has(forbiddenClId)
    if (forbiddenCl) {
      return false
    }
    const allowedClId = `${_class}_allowed` as Ref<Permission>
    const allowedCl = store.ps[space]?.has(allowedClId)
    if (allowedCl) {
      return true
    }
    const client = getClient()
    const h = client.getHierarchy()
    const ancestors = h.getAncestors(_class)
    const permissions = client
      .getModel()
      .findAllSync(core.class.Permission, { txClass: { $in: [core.class.TxUpdateDoc, core.class.TxMixin] } })
    for (const ancestor of ancestors) {
      const curr = permissions.filter(
        (p) =>
          p.objectClass === ancestor &&
          p.txMatch === undefined &&
          p.txClass === (h.isMixin(ancestor) ? core.class.TxMixin : core.class.TxUpdateDoc)
      )
      for (const permission of curr) {
        if (store.ps[space]?.has(permission._id)) {
          return permission.forbid !== true
        }
      }
    }
  }

  return !store.restrictedSpaces.has(space)
}

export function canRemoveDoc (_class: Ref<Class<Doc>>, space: Ref<Space>, store: PermissionsStore): boolean {
  if (!canMutateWorkspaceClass(getCurrentAccount(), getClient().getHierarchy().getAncestors(_class), 'remove')) return false
  const arePermissionsDisabled = getMetadata(core.metadata.DisablePermissions) ?? false
  if (arePermissionsDisabled) return true
  if (store.whitelist.has(space)) return true
  if (store.ps[space] !== undefined) {
    const client = getClient()
    const h = client.getHierarchy()
    const ancestors = h.getAncestors(_class)
    const permissions = client.getModel().findAllSync(core.class.Permission, { txClass: core.class.TxRemoveDoc })
    for (const ancestor of ancestors) {
      const curr = permissions.filter((p) => p.objectClass === ancestor && p.txMatch === undefined)
      for (const permission of curr) {
        if (store.ps[space]?.has(permission._id)) {
          return permission.forbid !== true
        }
      }
    }
  }

  return !store.restrictedSpaces.has(space)
}

export function canCreateObject (_class: Ref<Class<Doc>>, space: Ref<Space>, store: PermissionsStore): boolean {
  if (!canMutateWorkspaceClass(getCurrentAccount(), getClient().getHierarchy().getAncestors(_class), 'create')) return false
  const arePermissionsDisabled = getMetadata(core.metadata.DisablePermissions) ?? false
  if (arePermissionsDisabled) return true
  if (store.whitelist.has(space)) return true
  if (store.ps[space] !== undefined) {
    const client = getClient()
    const h = client.getHierarchy()
    const ancestors = h.getAncestors(_class)
    const permissions = client.getModel().findAllSync(core.class.Permission, { txClass: core.class.TxCreateDoc })
    for (const ancestor of ancestors) {
      const curr = permissions.filter((p) => p.objectClass === ancestor && p.txMatch === undefined)
      for (const permission of curr) {
        if (store.ps[space]?.has(permission._id)) {
          return permission.forbid !== true
        }
      }
    }
  }

  return !store.restrictedSpaces.has(space)
}
