import core, { AccountRole, getCurrentAccount, hasAccountRole, type Doc, type Ref, type TypedSpace } from '@hcengineering/core'
import document, { guidelineAccessFor, type Teamspace } from '@hcengineering/document'
import { createQuery, getClient } from '@hcengineering/presentation'
import { writable, type Readable } from 'svelte/store'

export function createGuidelineAccessQuery (): { editable: Readable<boolean>, query: (space: Ref<Teamspace>) => void } {
  const editable = writable(false)
  const spaces = createQuery()
  const sectors = createQuery()
  let previous: Ref<Teamspace> | undefined
  return {
    editable,
    query: (space) => {
      if (space === previous) return
      previous = space
      editable.set(false)
      spaces.query(document.class.Teamspace, { _id: space }, (rows) => {
        const teamspace = rows[0]
        if (teamspace === undefined) {
          sectors.unsubscribe()
          editable.set(false)
          return
        }
        sectors.query(core.class.TypedSpace, { _id: { $in: teamspace.guidelineEditorSectors ?? [] } }, (items) => {
          const account = getCurrentAccount()
          editable.set(hasAccountRole(account, AccountRole.User) && (hasAccountRole(account, AccountRole.Maintainer) || guidelineAccessFor(teamspace, account.uuid, new Map(items.map((sector) => [sector._id, sector.members]))) === 'editor'))
        })
      })
    }
  }
}

export async function canCreateGuidelineDocument (value?: Doc | Doc[]): Promise<boolean> {
  if (value === undefined || Array.isArray(value)) return false
  if (!hasAccountRole(getCurrentAccount(), AccountRole.User)) return false
  const client = getClient()
  const id = client.getHierarchy().isDerived(value._class, document.class.Teamspace) ? value._id : value.space
  const space = await client.findOne(document.class.Teamspace, { _id: id as Ref<Teamspace> })
  if (space === undefined) return false
  if (hasAccountRole(getCurrentAccount(), AccountRole.Maintainer)) return true
  const sectors = await client.findAll(core.class.TypedSpace, { _id: { $in: space.guidelineEditorSectors ?? [] } })
  return guidelineAccessFor(space, getCurrentAccount().uuid, new Map(sectors.map((sector) => [sector._id, sector.members]))) === 'editor'
}
