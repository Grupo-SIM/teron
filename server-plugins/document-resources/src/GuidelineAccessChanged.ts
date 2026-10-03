import core, { TxProcessor, type Doc, type Tx, type TxCUD, type TypedSpace } from '@hcengineering/core'
import document, { guidelineMembers } from '@hcengineering/document'
import type { TriggerControl } from '@hcengineering/server-core'

/** Keep existing space security, search filtering and security broadcasts on the effective membership. */
export async function GuidelineAccessChanged (txes: Tx[], control: TriggerControl): Promise<Tx[]> {
  const changed = txes.filter((tx) => TxProcessor.isExtendsCUD(tx._class) && control.hierarchy.isDerived((tx as TxCUD<Doc>).objectClass, core.class.TypedSpace)) as TxCUD<TypedSpace>[]
  if (changed.length === 0) return []
  const spaces = await control.findAll(control.ctx, document.class.Teamspace, { guidelineAccess: true })
  // Trigger engine runs after persistence. Read final records once; reapplying $push/$pull
  // here would duplicate operations or resurrect records removed by the same batch.
  const configured = spaces
  const sectorRefs = [...new Set(configured.flatMap((space) => [...(space.guidelineReaderSectors ?? []), ...(space.guidelineEditorSectors ?? [])]))]
  const sectors = await control.findAll(control.ctx, core.class.TypedSpace, { _id: { $in: sectorRefs } })
  const membersBySector = new Map(sectors.map((sector) => [sector._id, sector.members]))
  const result: Tx[] = []
  for (const space of configured) {
    const members = guidelineMembers(space, membersBySector)
    if (members.length !== space.members.length || members.some((member) => !space.members.includes(member))) {
      result.push(control.txFactory.createTxUpdateDoc(space._class, space.space, space._id, { members }))
    }
  }
  return result
}
