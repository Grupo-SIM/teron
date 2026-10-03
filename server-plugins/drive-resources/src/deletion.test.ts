import core, { type Doc, type Hierarchy } from '@hcengineering/core'
import drive from '@hcengineering/drive'
import { FindDriveResources, FindFolderResources } from './index'
const records = [
  { _id: 'folder', _class: drive.class.Folder, space: 'space', parent: 'none' },
  { _id: 'file', _class: drive.class.File, space: 'space', parent: 'folder' },
  { _id: 'version', _class: drive.class.FileVersion, space: 'space' },
  { _id: 'foreign', _class: drive.class.File, space: 'other', parent: 'folder' }
]
const findAll: any = async (clazz: string, query: Record<string, string>) => records.filter((record: any) => record._class === clazz && Object.entries(query).every(([key, value]) => record[key] === value))
describe('file deletion boundaries', () => {
  it('collects folders, files and versions only in the deleted space', async () => {
    const result = await FindDriveResources({ _id: 'space', _class: drive.class.Drive, space: core.space.Space } as Doc, {} as Hierarchy, findAll)
    expect(result.map((doc) => doc._id)).toEqual(['file', 'folder', 'version'])
  })
  it('does not follow a foreign-space folder reference', async () => {
    const result = await FindFolderResources(records[0] as Doc, {} as Hierarchy, findAll)
    expect(result.map((doc) => doc._id)).toEqual(['file'])
  })
})
