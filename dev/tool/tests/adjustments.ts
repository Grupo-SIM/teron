import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import core, { TxOperations, WorkspaceEvent } from '@hcengineering/core'
import { createClient } from '@hcengineering/server-client'
import contact, { AvatarType } from '@hcengineering/contact'
import calendar from '@hcengineering/calendar'
import document from '@hcengineering/document'
import tracker from '@hcengineering/tracker'
import drive from '@hcengineering/drive'
import attachment from '@hcengineering/attachment'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import WebSocket from 'ws'

async function main (): Promise<void> {
  const state = JSON.parse(readFileSync('/tmp/teron-regression-accounts.json', 'utf8'))
  const ownerRaw = await createClient('ws://localhost:30133', state.ownerWs.token, undefined, 30000)
  const userRaw = await createClient('ws://localhost:30133', state.userWs.token, undefined, 30000)
  const owner = new TxOperations(ownerRaw, state.owner.socialId)
  const user = new TxOperations(userRaw, state.user.socialId)
  const passed: string[] = []
  const providers: any[] = []
  try {
    async function ensureIdentity (account: any, token: string, label: string): Promise<any> {
      const person: any = `regression-account-${label}-person`
      if (await owner.findOne(contact.class.Person, { _id: person }) === undefined) {
        await owner.createDoc(contact.class.Person, contact.space.Contacts, { name: `${label},Regressão`, avatarType: AvatarType.COLOR, personUuid: account.account }, person)
        await owner.createMixin(person, contact.class.Person, contact.space.Contacts, contact.mixin.Employee, { active: true })
      }
      const response = await fetch('http://localhost:30130', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ method: 'getSocialIds', params: {} }) })
      const { result: identities } = await response.json()
      for (const identity of identities) {
        if (await owner.findOne(contact.class.SocialIdentity, { _id: identity._id }) === undefined) await owner.addCollection(contact.class.SocialIdentity, contact.space.Contacts, person, contact.class.Person, 'socialIds', { type: identity.type, value: identity.value, key: `${identity.type}:${identity.value}`, verifiedOn: identity.verifiedOn, isDeleted: false }, identity._id)
      }
      return { attachedTo: person }
    }
    const ownerIdentity = await ensureIdentity(state.owner, state.ownerWs.token, 'owner')
    const userIdentity = await ensureIdentity(state.user, state.userWs.token, 'user')
    const events = await user.findAll(calendar.class.Event, { _id: { $in: ['regression-event-secret', 'regression-event-public', 'regression-event-inherited-private'] as any } })
    assert.equal(events.length, 3)
    for (const id of ['regression-event-secret', 'regression-event-inherited-private']) {
      const busy = events.find((event) => event._id === id)!
      assert.equal(busy.title, '')
      assert.equal(busy.description, '')
      assert.equal(busy.location, undefined)
      assert.deepEqual(busy.participants, [])
      assert.ok(busy.dueDate > busy.date)
      assert.equal((await user.findAll(calendar.class.Event, { _id: id as any, title: { $contains: 'Segredo' } })).length, 0)
    }
    assert.equal(events.find((event) => event._id === 'regression-event-public')?.title, 'Reunião pública')
    assert.equal((await owner.findOne(calendar.class.Event, { _id: 'regression-event-secret' as any }))?.title, 'Segredo Owner')
    passed.push('two-account event privacy and detail-predicate protection')

    async function uploadBlob (text: string): Promise<string> {
      const form = new FormData()
      form.append('file', new Blob([text], { type: 'text/plain' }), 'regression.txt')
      const response = await fetch('http://localhost:30180/files', { method: 'POST', headers: { Authorization: `Bearer ${state.ownerWs.token}` }, body: form })
      assert.equal(response.status, 200)
      return (await response.json())[0].id
    }
    async function blobExists (id: string): Promise<boolean> {
      const response = await fetch(`http://localhost:30180/files?file=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${state.ownerWs.token}` } })
      assert.ok([200, 404].includes(response.status), `Unexpected blob status ${response.status}`)
      return response.status === 200
    }
    const secret = await owner.findOne(calendar.class.Event, { _id: 'regression-event-secret' as any })
    assert.ok(secret)
    const secretAttachment: any = 'regression-private-event-attachment'
    if (await owner.findOne(attachment.class.Attachment, { _id: secretAttachment }) === undefined) {
      await owner.addCollection(attachment.class.Attachment, secret.space, secret._id, secret._class, 'attachments', { name: 'Conteúdo confidencial', file: await uploadBlob('Private agenda attachment') as any, size: 25, type: 'text/plain', lastModified: Date.now() }, secretAttachment)
    }
    assert.equal(await user.findOne(attachment.class.Attachment, { _id: secretAttachment }), undefined)
    const observed: any[] = []
    userRaw.notify = (...txes: any[]) => { observed.push(...txes.flat()) }
    const realtimeSecret = 'regression-private-realtime-secret'
    await owner.updateDoc(calendar.class.Event, secret.space, secret._id, { description: realtimeSecret })
    await new Promise((resolve) => setTimeout(resolve, 1000))
    assert.ok(observed.some((tx) => tx.event === WorkspaceEvent.BulkUpdate), 'Expected detail-free realtime invalidation')
    assert.equal(JSON.stringify(observed).includes(realtimeSecret), false)
    passed.push('private event attachments blocked via base/direct reads and detail-free realtime')
    async function ensureSpace (clazz: any, id: any, type: any): Promise<void> {
      if (await owner.findOne(clazz, { _id: id }) === undefined) await owner.createDoc(clazz, core.space.Space, {
        name: id, description: '', private: false, archived: false, members: [state.owner.account], owners: [state.owner.account], type
      }, id)
    }
    const deleting: any = 'regression-delete-guidelines'
    const retaining: any = 'regression-retain-guidelines'
    for (const id of [deleting, retaining]) await ensureSpace(document.class.Teamspace, id, document.spaceType.DefaultTeamspaceType)
    const parentId: any = 'regression-delete-parent'
    const childId: any = 'regression-delete-child'
    const retainedId: any = 'regression-retain-document'
    for (const [id, space, parent] of [[parentId, deleting, document.ids.NoParent], [childId, deleting, parentId], [retainedId, retaining, parentId]]) {
      if (await owner.findOne(document.class.Document, { _id: id }) === undefined) await owner.createDoc(document.class.Document, space, { title: id, content: null, parent, rank: '0|hzzzzz:' }, id)
    }
    const attachmentBlob = await uploadBlob('Descendant attachment removed with active guideline space')
    await owner.addCollection(attachment.class.Attachment, deleting, childId, document.class.Document, 'attachments', { name: 'descendant.txt', file: attachmentBlob as any, size: 64, type: 'text/plain', lastModified: Date.now() })
    assert.ok(await blobExists(attachmentBlob))
    await owner.removeDoc(document.class.Teamspace, core.space.Space, deleting)
    assert.equal(await owner.findOne(document.class.Document, { _id: parentId }), undefined)
    assert.equal(await owner.findOne(document.class.Document, { _id: childId }), undefined)
    assert.ok(await owner.findOne(document.class.Document, { _id: retainedId }))
    assert.equal(await blobExists(attachmentBlob), false)

    const driveId: any = 'regression-delete-drive'
    const otherDrive: any = 'regression-retain-drive'
    for (const id of [driveId, otherDrive]) await ensureSpace(drive.class.Drive, id, drive.spaceType.DefaultDrive)
    const folderId: any = 'regression-delete-folder'
    const fileId: any = 'regression-delete-file'
    const otherFolder: any = 'regression-retain-folder'
    for (const [id, space, parent] of [[folderId, driveId, drive.ids.Root], [otherFolder, otherDrive, folderId]]) {
      if (await owner.findOne(drive.class.Folder, { _id: id }) === undefined) await owner.createDoc(drive.class.Folder, space, { title: id, parent, path: [] }, id)
    }
    const versionId: any = 'regression-delete-version'
    if (await owner.findOne(drive.class.File, { _id: fileId }) === undefined) await owner.createDoc(drive.class.File, driveId, { title: 'Arquivo regressão', parent: folderId, path: [folderId], file: versionId, version: 1, versions: 0 }, fileId)
    const versionBlob = await uploadBlob('File version removed with active drive')
    await owner.addCollection(drive.class.FileVersion, driveId, fileId, drive.class.File, 'versions', { title: 'Arquivo regressão', file: versionBlob as any, size: 38, type: 'text/plain', lastModified: Date.now(), version: 1 }, versionId)
    assert.ok(await blobExists(versionBlob))
    await owner.removeDoc(drive.class.Drive, core.space.Space, driveId)
    assert.equal(await owner.findOne(drive.class.Folder, { _id: folderId }), undefined)
    assert.equal(await owner.findOne(drive.class.File, { _id: fileId }), undefined)
    assert.equal(await owner.findOne(drive.class.FileVersion, { _id: versionId }), undefined)
    assert.ok(await owner.findOne(drive.class.Folder, { _id: otherFolder }))
    assert.equal(await blobExists(versionBlob), false)
    passed.push('active guideline/drive deletion, descendant attachments/version blobs and cross-space boundary')

    const sector = (await owner.findAll(tracker.class.Project, {}))[0]
    assert.ok(sector)
    const originalMembers = [...sector.members]
    const spaceId: any = 'regression-grant-teamspace'
    if (await owner.findOne(document.class.Teamspace, { _id: spaceId }) === undefined) {
      await owner.createDoc(document.class.Teamspace, core.space.Space, {
        name: 'Diretrizes com concessões', description: '', private: true, archived: false,
        members: [state.owner.account, state.user.account], owners: [state.owner.account], type: document.spaceType.DefaultTeamspaceType,
        guidelineAccess: true, guidelineReaders: [state.user.account], guidelineEditors: [], guidelineReaderSectors: [], guidelineEditorSectors: []
      }, spaceId)
    } else {
      await owner.updateDoc(document.class.Teamspace, core.space.Space, spaceId, { guidelineReaders: [state.user.account], guidelineEditors: [], guidelineReaderSectors: [], guidelineEditorSectors: [] })
    }
    const docId: any = 'regression-grant-document'
    if (await owner.findOne(document.class.Document, { _id: docId }) === undefined) await owner.createDoc(document.class.Document, spaceId, { title: 'Documento herdado', content: null, parent: document.ids.NoParent, rank: '0|hzzzzz:' }, docId)
    // Reuse the installed editor's exact collaboration protocol implementation.
    const editorRequire = createRequire(resolve('plugins/text-editor-resources/package.json'))
    const { HocuspocusProvider } = editorRequire('@hocuspocus/provider')
    const Y = editorRequire('yjs')
    async function connectEditor (token: string): Promise<any> {
      let provider: any
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Collaborative websocket sync timed out.')), 30000)
        provider = new HocuspocusProvider({
          url: 'ws://localhost:30178', name: collaborativeName, token, WebSocketPolyfill: WebSocket,
          onSynced: ({ state }: any) => { if (state) { clearTimeout(timer); resolve() } },
          onAuthenticationFailed: ({ reason }: any) => { clearTimeout(timer); reject(new Error(reason)) }
        })
        providers.push(provider)
      })
      return provider
    }
    async function waitUntil (predicate: () => boolean): Promise<void> {
      for (let i = 0; i < 100; i++) {
        if (predicate()) return
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      assert.ok(predicate(), 'Collaborative websocket condition timed out.')
    }
    function writeParagraph (provider: any, text: string): void {
      const paragraph = new Y.XmlElement('paragraph')
      const textNode = new Y.XmlText()
      textNode.insert(0, text)
      paragraph.insert(0, [textNode])
      provider.document.getXmlFragment('content').insert(0, [paragraph])
    }
    const collaborativeName = [state.ws.workspace, document.class.Document, docId, 'content'].join('|')
    async function collaborativeRpc (token: string, method: string, payload: any): Promise<Response> {
      return await fetch(`http://localhost:30178/rpc/${encodeURIComponent(collaborativeName)}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, payload }), signal: AbortSignal.timeout(30000)
      })
    }
    assert.ok(await user.findOne(document.class.Document, { _id: docId }))
    assert.equal((await collaborativeRpc(state.userWs.token, 'getContent', {})).status, 200)
    const ownerEditor = await connectEditor(state.ownerWs.token)
    const readerEditor = await connectEditor(state.userWs.token)
    assert.equal(readerEditor.authorizedScope, 'readonly')
    writeParagraph(readerEditor, 'reader-websocket-forbidden')
    await new Promise((resolve) => setTimeout(resolve, 500))
    assert.equal(ownerEditor.document.getXmlFragment('content').toString().includes('reader-websocket-forbidden'), false)
    readerEditor.destroy()
    readerEditor.configuration.websocketProvider.destroy()
    assert.equal((await collaborativeRpc(state.userWs.token, 'updateContent', { content: { content: '<p>Leitor não escreve</p>' } })).status, 500)
    await assert.rejects(user.updateDoc(document.class.Document, spaceId, docId, { title: 'Leitor não edita' }))
    await owner.updateDoc(document.class.Teamspace, core.space.Space, spaceId, { guidelineEditors: [state.user.account] })
    await user.updateDoc(document.class.Document, spaceId, docId, { title: 'Editor edita' })
    const writerEditor = await connectEditor(state.userWs.token)
    assert.equal(writerEditor.authorizedScope, 'read-write')
    const writerMarker = `editor-websocket-${Date.now()}`
    writeParagraph(writerEditor, writerMarker)
    await waitUntil(() => ownerEditor.document.getXmlFragment('content').toString().includes(writerMarker))
    let revoked = false
    writerEditor.on('close', ({ event }: any) => { if (event.code === 4403) revoked = true })
    assert.equal((await collaborativeRpc(state.userWs.token, 'updateContent', { content: { content: '<p>Editor autorizado</p>' } })).status, 200)
    await assert.rejects(user.removeDoc(document.class.Document, spaceId, docId))
    await assert.rejects(user.updateDoc(document.class.Teamspace, core.space.Space, spaceId, { guidelineEditors: [] }))
    await owner.updateDoc(document.class.Teamspace, core.space.Space, spaceId, { guidelineReaders: [], guidelineEditors: [], guidelineEditorSectors: [sector._id] })
    try {
      await owner.updateDoc(tracker.class.Project, core.space.Space, sector._id, { members: [state.owner.account, state.user.account] })
      await user.updateDoc(document.class.Document, spaceId, docId, { title: 'Editor por setor' })
      await owner.updateDoc(tracker.class.Project, core.space.Space, sector._id, { members: [state.owner.account] })
      assert.equal(await user.findOne(document.class.Document, { _id: docId }), undefined)
      await waitUntil(() => revoked)
      assert.equal((await collaborativeRpc(state.userWs.token, 'getContent', {})).status, 500)
      assert.equal((await collaborativeRpc(state.userWs.token, 'updateContent', { content: { content: '<p>Revogado</p>' } })).status, 500)
      await assert.rejects(user.updateDoc(document.class.Document, spaceId, docId, { title: 'Acesso revogado' }))
    } finally {
      for (const provider of providers) { provider.destroy(); provider.configuration.websocketProvider.destroy() }
      await owner.updateDoc(tracker.class.Project, core.space.Space, sector._id, { members: originalMembers })
      await owner.updateDoc(document.class.Teamspace, core.space.Space, spaceId, { guidelineReaders: [state.user.account], guidelineEditorSectors: [] })
    }
    passed.push('inherited individual/sector grants, editor precedence, deletion denial and sector exit revocation')
    passed.push('collaborative RPC/websocket reader/editor enforcement, broadcast updates and revocation')

    const issueId: any = 'regression-parent-issue'
    const issue = await owner.findOne(tracker.class.Issue, { _id: issueId })
    assert.ok(issue)
    async function activeTodos (expected: number): Promise<any[]> {
      let todos: any[] = []
      for (let attempt = 0; attempt < 100; attempt++) {
        todos = await owner.findAll('time:class:ToDo' as any, { attachedTo: issueId, doneOn: null } as any)
        if (todos.length === expected) return todos
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      assert.equal(todos.length, expected)
      return todos
    }
    await owner.updateDoc(tracker.class.Issue, issue.space, issueId, { status: tracker.status.Done, assignees: [] })
    await activeTodos(0)
    await owner.updateDoc(tracker.class.Issue, issue.space, issueId, { status: tracker.status.InProgress, assignees: [ownerIdentity.attachedTo, userIdentity.attachedTo, userIdentity.attachedTo] })
    const assigned: any = await owner.findOne(tracker.class.Issue, { _id: issueId })
    assert.deepEqual(assigned.assignees, [ownerIdentity.attachedTo, userIdentity.attachedTo])
    assert.equal(Object.hasOwn(assigned, 'assignee'), false)
    // Combined status/assignment changes must reconcile once, even after reopening.
    const combinedTodos = await activeTodos(2)
    assert.equal(combinedTodos.length, 2)
    await user.updateDoc(tracker.class.Issue, issue.space, issueId, { status: tracker.status.InProgress })
    await assert.rejects(user.updateDoc(tracker.class.Issue, issue.space, issueId, { dueDate: Date.now() }))
    await owner.updateDoc(tracker.class.Issue, issue.space, issueId, { assignees: [] })
    await assert.rejects(user.updateDoc(tracker.class.Issue, issue.space, issueId, { status: tracker.status.Done }))
    await user.updateDoc(tracker.class.Issue, issue.space, issueId, { description: '<p>Comentário acessível</p>' })
    assert.deepEqual((await owner.findOne(tracker.class.Issue, { _id: issueId }))?.assignees, [])
    const beforeBatch = await owner.findOne(tracker.class.Issue, { _id: issueId })
    const batch = user.apply(undefined, 'regression-denied-batch')
    await batch.updateDoc(tracker.class.Issue, issue.space, issueId, { description: 'Batch must not persist' })
    await batch.updateDoc(tracker.class.Issue, issue.space, issueId, { title: 'Forbidden structure' })
    await assert.rejects(batch.commit())
    assert.equal((await owner.findOne(tracker.class.Issue, { _id: issueId }))?.description, beforeBatch?.description)
    await assert.rejects(user.updateDoc(contact.class.Person, contact.space.Contacts, ownerIdentity.attachedTo, { name: 'Alteração organizacional' }))
    await owner.updateDoc(tracker.class.Issue, issue.space, issueId, { assignees: [ownerIdentity.attachedTo, userIdentity.attachedTo, userIdentity.attachedTo] })
    const collaborators = await owner.findAll(core.class.Collaborator, { attachedTo: issueId })
    assert.ok(collaborators.some((row) => row.collaborator === state.user.account))
    assert.equal(collaborators.filter((row) => row.collaborator === state.user.account).length, 1)
    assert.equal(collaborators.filter((row) => row.collaborator === state.owner.account).length, 1)
    const todos = await activeTodos(2)
    assert.deepEqual(todos.map((todo) => todo.user).sort(), [ownerIdentity.attachedTo, userIdentity.attachedTo].sort())
    passed.push('batch atomic authorization, protected contacts and deduplicated notification collaborators/personal agendas')
    passed.push('multiple/zero assignees, deduplication, canonical writes and assigned-only status changes')
    console.log(JSON.stringify({ passed }, null, 2))
  } finally {
    for (const provider of providers) { provider.destroy(); provider.configuration.websocketProvider.destroy() }
    await userRaw.close()
    await ownerRaw.close()
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
