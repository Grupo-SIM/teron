import { getClient as getAccountClient } from '@hcengineering/account-client'
import { isReadOnlyOrGuest } from '@hcengineering/account'
import { decodeDocumentId } from '@hcengineering/collaborator-client'
import core, { AccountRole, type Client, systemAccountUuid } from '@hcengineering/core'
import document, { guidelineAccessFor } from '@hcengineering/document'
import task from '@hcengineering/task'
import { createClient, getTransactorEndpoint } from '@hcengineering/server-client'
import { type Token, generateToken } from '@hcengineering/server-token'
import config from './config'

export interface CollaborationAccess {
  client: Client
  check: () => Promise<boolean>
  close: () => Promise<void>
}

/** Use the caller's transactor connection, so direct document links obey space security too. */
export async function openCollaborationAccess (token: Token, documentName: string, initialContent?: string): Promise<CollaborationAccess> {
  const userToken = generateToken(token.account, token.workspace, token.extra)
  const endpoint = await getTransactorEndpoint(userToken)
  const client = await createClient(endpoint, userToken)
  const { documentId } = decodeDocumentId(documentName)
  const checkAccess = async (verifyInitialContent: boolean): Promise<boolean> => {
    const doc = await client.findOne(documentId.objectClass, { _id: documentId.objectId })
    if (doc === undefined) throw new Error('Collaborative document is inaccessible.')
    if (verifyInitialContent && initialContent !== undefined && (doc as any)[documentId.objectAttr] !== initialContent) throw new Error('Initial content does not belong to this document.')
    const hierarchy = client.getHierarchy()
    const attribute = hierarchy.findAttribute(doc._class, documentId.objectAttr)
    if (attribute?.type._class !== core.class.TypeCollaborativeDoc) throw new Error('Field is not collaborative content.')
    if (token.account === systemAccountUuid) return false
    const accountClient = getAccountClient(config.AccountsUrl, userToken)
    const members = await accountClient.getWorkspaceMembers()
    const role = members.find((member) => member.person === token.account)?.role
    if (isReadOnlyOrGuest(token.account, token.extra)) return true
    if (role !== undefined && Object.values(AccountRole).includes(role) && hierarchy.isDerived(doc._class, task.class.Task) && documentId.objectAttr === 'description') return false
    const readonly = ![AccountRole.User, AccountRole.Maintainer, AccountRole.Owner].includes(role as AccountRole)
    if (readonly) return true
    if (hierarchy.isDerived(doc._class, document.class.Document)) {
      const space = await client.findOne(document.class.Teamspace, { _id: doc.space })
      if (space === undefined) throw new Error('Guideline space is inaccessible.')
      if ((doc as any).lockedBy != null) return true
      if (role === AccountRole.Owner || role === AccountRole.Maintainer) return false
      const sectors = await client.findAll(core.class.TypedSpace, { _id: { $in: space.guidelineEditorSectors ?? [] } })
      return guidelineAccessFor(space, token.account, new Map(sectors.map((sector) => [sector._id, sector.members]))) !== 'editor'
    }
    if (role === AccountRole.Owner || role === AccountRole.Maintainer) return false
    return !(hierarchy.isDerived(doc._class, task.class.Task) && documentId.objectAttr === 'description')
  }
  try {
    await checkAccess(true)
    return { client, check: async () => await checkAccess(false), close: async () => await client.close() }
  } catch (error) {
    await client.close()
    throw error
  }
}
