import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import core, { TxOperations } from '@hcengineering/core'
import { createClient } from '@hcengineering/server-client'
import contact, { AvatarType } from '@hcengineering/contact'
import calendar from '@hcengineering/calendar'
import document from '@hcengineering/document'
import tracker from '@hcengineering/tracker'

async function main (): Promise<void> {
  const state = JSON.parse(readFileSync('/tmp/teron-regression-accounts.json', 'utf8'))
  const ownerRaw = await createClient('ws://localhost:30133', state.ownerWs.token, undefined, 30000)
  const userRaw = await createClient('ws://localhost:30133', state.userWs.token, undefined, 30000)
  const owner = new TxOperations(ownerRaw, state.owner.socialId)
  const user = new TxOperations(userRaw, state.user.socialId)
  const passed: string[] = []
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
    assert.ok(await user.findOne(document.class.Document, { _id: docId }))
    await assert.rejects(user.updateDoc(document.class.Document, spaceId, docId, { title: 'Leitor não edita' }))
    await owner.updateDoc(document.class.Teamspace, core.space.Space, spaceId, { guidelineEditors: [state.user.account] })
    await user.updateDoc(document.class.Document, spaceId, docId, { title: 'Editor edita' })
    await assert.rejects(user.removeDoc(document.class.Document, spaceId, docId))
    await assert.rejects(user.updateDoc(document.class.Teamspace, core.space.Space, spaceId, { guidelineEditors: [] }))
    await owner.updateDoc(document.class.Teamspace, core.space.Space, spaceId, { guidelineReaders: [], guidelineEditors: [], guidelineEditorSectors: [sector._id] })
    try {
      await owner.updateDoc(tracker.class.Project, core.space.Space, sector._id, { members: [state.owner.account, state.user.account] })
      await user.updateDoc(document.class.Document, spaceId, docId, { title: 'Editor por setor' })
      await owner.updateDoc(tracker.class.Project, core.space.Space, sector._id, { members: [state.owner.account] })
      assert.equal(await user.findOne(document.class.Document, { _id: docId }), undefined)
      await assert.rejects(user.updateDoc(document.class.Document, spaceId, docId, { title: 'Acesso revogado' }))
    } finally {
      await owner.updateDoc(tracker.class.Project, core.space.Space, sector._id, { members: originalMembers })
      await owner.updateDoc(document.class.Teamspace, core.space.Space, spaceId, { guidelineReaders: [state.user.account], guidelineEditorSectors: [] })
    }
    passed.push('inherited individual/sector grants, editor precedence, deletion denial and sector exit revocation')

    const issueId: any = 'regression-parent-issue'
    const issue = await owner.findOne(tracker.class.Issue, { _id: issueId })
    assert.ok(issue)
    await owner.updateDoc(tracker.class.Issue, issue.space, issueId, { assignees: [ownerIdentity.attachedTo, userIdentity.attachedTo, userIdentity.attachedTo] })
    const assigned: any = await owner.findOne(tracker.class.Issue, { _id: issueId })
    assert.deepEqual(assigned.assignees, [ownerIdentity.attachedTo, userIdentity.attachedTo])
    assert.equal(Object.hasOwn(assigned, 'assignee'), false)
    await user.updateDoc(tracker.class.Issue, issue.space, issueId, { status: tracker.status.InProgress })
    await assert.rejects(user.updateDoc(tracker.class.Issue, issue.space, issueId, { dueDate: Date.now() }))
    await owner.updateDoc(tracker.class.Issue, issue.space, issueId, { assignees: [] })
    await assert.rejects(user.updateDoc(tracker.class.Issue, issue.space, issueId, { status: tracker.status.Done }))
    await user.updateDoc(tracker.class.Issue, issue.space, issueId, { description: '<p>Comentário acessível</p>' })
    assert.deepEqual((await owner.findOne(tracker.class.Issue, { _id: issueId }))?.assignees, [])
    passed.push('multiple/zero assignees, deduplication, canonical writes and assigned-only status changes')
    console.log(JSON.stringify({ passed }, null, 2))
  } finally {
    await userRaw.close()
    await ownerRaw.close()
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
