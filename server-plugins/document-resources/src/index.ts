//
// Copyright © 2024 Hardcore Engineering Inc.
//
//

import { Class, Doc, DocumentQuery, FindOptions, FindResult, Hierarchy, Ref, concatLink } from '@hcengineering/core'
import document, { Document, documentId } from '@hcengineering/document'
import { getMetadata } from '@hcengineering/platform'
import { workbenchId } from '@hcengineering/workbench'
import serverCore, { TriggerControl } from '@hcengineering/server-core'
import slugify from 'slugify'
import { GuidelineAccessChanged } from './GuidelineAccessChanged'
export { DocumentLockMiddleware } from './DocumentLockMiddleware'

function getDocumentId (doc: Document): string {
  const slug = slugify(doc.title, { lower: true })
  return `${slug}-${doc._id}`
}

/**
 * @public
 */
export async function documentHTMLPresenter (doc: Doc, control: TriggerControl): Promise<string> {
  const document = doc as Document
  const front = control.branding?.front ?? getMetadata(serverCore.metadata.FrontUrl) ?? ''
  const path = `${workbenchId}/${control.workspace.url}/${documentId}/${getDocumentId(document)}`
  const link = concatLink(front, path)
  return `<a href="${link}">${document.title}</a>`
}

export async function documentLinkIdProvider (doc: Document): Promise<string> {
  return getDocumentId(doc)
}

/**
 * @public
 */
export async function documentTextPresenter (doc: Doc): Promise<string> {
  const document = doc as Document
  return document.title
}

/**
 * @public
 */
export async function findChildDocuments (
  doc: Doc,
  hiearachy: Hierarchy,
  findAll: <T extends Doc>(
    clazz: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ) => Promise<FindResult<T>>
): Promise<Doc[]> {
  const children = await findAll(document.class.Document, { parent: doc._id as Ref<Document>, space: doc.space })
  const snapshots = await findAll(document.class.DocumentSnapshot, { parent: doc._id as Ref<Document>, space: doc.space })
  return [...children, ...snapshots]
}

export async function findTeamspaceDocuments (
  doc: Doc,
  hierarchy: Hierarchy,
  findAll: <T extends Doc>(clazz: Ref<Class<T>>, query: DocumentQuery<T>, options?: FindOptions<T>) => Promise<FindResult<T>>
): Promise<Doc[]> {
  const documents = await findAll(document.class.Document, { space: doc._id as Document['space'] })
  const snapshots = await findAll(document.class.DocumentSnapshot, { space: doc._id as Document['space'] })
  return [...documents, ...snapshots]
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async () => ({
  trigger: { GuidelineAccessChanged },
  function: {
    DocumentHTMLPresenter: documentHTMLPresenter,
    DocumentTextPresenter: documentTextPresenter,
    DocumentLinkIdProvider: documentLinkIdProvider,
    FindChildDocuments: findChildDocuments,
    FindTeamspaceDocuments: findTeamspaceDocuments
  }
})
