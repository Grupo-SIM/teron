import { type AccountUuid, type Ref, type TypedSpace } from '@hcengineering/core'

export interface GuidelineGrants {
  guidelineAccess?: boolean
  guidelineReaders?: AccountUuid[]
  guidelineEditors?: AccountUuid[]
  guidelineReaderSectors?: Ref<TypedSpace>[]
  guidelineEditorSectors?: Ref<TypedSpace>[]
}

export type GuidelineAccess = 'reader' | 'editor'
export type SectorMembers = ReadonlyMap<Ref<TypedSpace>, readonly AccountUuid[]>

/** Grants are additive. Sector membership is resolved from current records, never a copied snapshot. */
export function guidelineAccessFor (
  space: GuidelineGrants & { members: AccountUuid[], owners?: AccountUuid[] },
  account: AccountUuid,
  sectors: SectorMembers
): GuidelineAccess | undefined {
  if (space.guidelineAccess !== true) return space.members.includes(account) ? 'editor' : undefined
  const included = (refs: Ref<TypedSpace>[] | undefined): boolean => (refs ?? []).some((ref) => sectors.get(ref)?.includes(account))
  if (space.owners?.includes(account) || space.guidelineEditors?.includes(account) || included(space.guidelineEditorSectors)) return 'editor'
  if (space.guidelineReaders?.includes(account) || included(space.guidelineReaderSectors)) return 'reader'
  return undefined
}

export function guidelineMembers (
  space: GuidelineGrants & { members: AccountUuid[], owners?: AccountUuid[] },
  sectors: SectorMembers
): AccountUuid[] {
  if (space.guidelineAccess !== true) return [...new Set(space.members)]
  return [...new Set([
    ...(space.owners ?? []), ...(space.guidelineReaders ?? []), ...(space.guidelineEditors ?? []),
    ...[...(space.guidelineReaderSectors ?? []), ...(space.guidelineEditorSectors ?? [])].flatMap((ref) => [...(sectors.get(ref) ?? [])])
  ])]
}
