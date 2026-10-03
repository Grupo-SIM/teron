import core, { AccountRole } from '@hcengineering/core'
import document from '@hcengineering/document'
import { openCollaborationAccess } from './collaboration-access'

const member = { person: 'user', role: AccountRole.User }
const doc: any = { _id: 'doc', _class: document.class.Document, space: 'space', content: 'blob' }
const space: any = { _id: 'space', members: ['user'], guidelineAccess: true, guidelineReaders: ['user'], guidelineEditors: [] }
const client = {
  findOne: jest.fn(async (clazz: string) => clazz === document.class.Teamspace ? space : doc),
  findAll: jest.fn(async () => []),
  close: jest.fn(async () => {}),
  getHierarchy: () => ({ findAttribute: () => ({ type: { _class: core.class.TypeCollaborativeDoc } }), isDerived: (actual: string, expected: string) => actual === expected })
}
jest.mock('./config', () => ({ __esModule: true, default: { AccountsUrl: 'http://local' } }))
jest.mock('@hcengineering/server-client', () => ({ getTransactorEndpoint: async () => 'local', createClient: async () => client }))
jest.mock('@hcengineering/server-token', () => ({ generateToken: () => 'local-token' }))
jest.mock('@hcengineering/collaborator-client', () => ({ decodeDocumentId: () => ({ documentId: { objectClass: 'document:class:Document', objectId: 'doc', objectAttr: 'content' } }) }))
jest.mock('@hcengineering/account-client', () => ({ getClient: () => ({ getWorkspaceMembers: async () => [member] }) }))
const token: any = { account: 'user', workspace: 'local', extra: {} }
beforeEach(() => {
  member.role = AccountRole.User
  doc.content = 'blob'
  delete doc.lockedBy
  space.guidelineReaders = ['user']
  space.guidelineEditors = []
  client.findOne.mockImplementation(async (clazz) => clazz === document.class.Teamspace ? space : doc)
  client.close.mockClear()
})
describe('collaborative document access', () => {
  it('allows readers to connect read-only and responds to grant changes', async () => {
    const access = await openCollaborationAccess(token, 'local', 'blob')
    expect(await access.check()).toBe(true)
    space.guidelineEditors = ['user']
    expect(await access.check()).toBe(false)
    space.guidelineEditors = []
    expect(await access.check()).toBe(true)
    await access.close()
    expect(client.close).toHaveBeenCalledTimes(1)
  })
  it('validates initial source once and permits legitimate content changes', async () => {
    space.guidelineEditors = ['user']
    await expect(openCollaborationAccess(token, 'local', 'foreign-blob')).rejects.toThrow('Initial content')
    const access = await openCollaborationAccess(token, 'local', 'blob')
    doc.content = 'next-blob'
    expect(await access.check()).toBe(false)
  })
  it('rechecks direct access after revocation and closes failed handshakes', async () => {
    const access = await openCollaborationAccess(token, 'local')
    client.findOne.mockResolvedValue(undefined)
    await expect(access.check()).rejects.toThrow('inaccessible')
    await expect(openCollaborationAccess(token, 'local')).rejects.toThrow('inaccessible')
    expect(client.close).toHaveBeenCalledTimes(1)
  })
  it('enforces workspace role changes and document locks', async () => {
    space.guidelineEditors = ['user']
    const access = await openCollaborationAccess(token, 'local')
    expect(await access.check()).toBe(false)
    member.role = AccountRole.ReadOnlyGuest
    expect(await access.check()).toBe(true)
    member.role = AccountRole.Owner
    doc.lockedBy = 'owner'
    expect(await access.check()).toBe(true)
  })
})
