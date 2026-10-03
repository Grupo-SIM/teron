import { type AccountUuid, type Ref, type TypedSpace } from '@hcengineering/core'
import { guidelineAccessFor, guidelineMembers } from './access'
const user = 'user' as AccountUuid
const sector = 'sector' as Ref<TypedSpace>
describe('guideline grants', () => {
  it('preserves legacy memberships until explicit migration', () => {
    expect(guidelineAccessFor({ members: [user] }, user, new Map())).toBe('editor')
    expect(guidelineAccessFor({ members: [] }, user, new Map())).toBeUndefined()
  })
  it('sums person and sector grants with editor precedence', () => {
    const space = { members: [], guidelineAccess: true, guidelineReaders: [user], guidelineEditorSectors: [sector] }
    expect(guidelineAccessFor(space, user, new Map([[sector, [user]]]))).toBe('editor')
    expect(guidelineAccessFor(space, user, new Map([[sector, []]]))).toBe('reader')
    expect(guidelineMembers(space, new Map([[sector, [user]]]))).toEqual([user])
  })
  it('revokes inherited access when someone leaves the sector', () => {
    const space = { members: [user], guidelineAccess: true, guidelineReaderSectors: [sector] }
    expect(guidelineAccessFor(space, user, new Map([[sector, []]]))).toBeUndefined()
    expect(guidelineMembers(space, new Map([[sector, []]]))).toEqual([])
  })
})
