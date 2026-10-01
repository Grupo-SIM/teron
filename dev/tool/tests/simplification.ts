import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import core, { TxOperations, type Class, type Data, type Doc, type Ref } from '@hcengineering/core'
import { createClient } from '@hcengineering/server-client'
import contact, { AvatarType } from '@hcengineering/contact'
import calendar, { AccessLevel } from '@hcengineering/calendar'
import tags from '@hcengineering/tags'
import document from '@hcengineering/document'
import tracker from '@hcengineering/tracker'
import love, { RoomAccess, RoomType } from '../../../plugins/love/src'

const accountUrl = 'http://localhost:30130'
const statePath = process.env.TERON_REGRESSION_STATE ?? '/tmp/teron-regression-accounts.json'

async function rpc (method: string, params: object, token = ''): Promise<any> {
  const response = await fetch(accountUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ method, params })
  })
  const result = await response.json()
  if (result.error !== undefined) throw new Error(JSON.stringify(result.error))
  return result.result
}

async function initialize (): Promise<void> {
  if (existsSync(statePath)) return
  async function account (email: string, firstName: string): Promise<any> {
    const params = { email, password: 'Regression123!', firstName, lastName: 'Regressão' }
    try {
      return await rpc('signUp', params)
    } catch {
      return await rpc('login', params)
    }
  }
  const owner = await account('owner@regression.local', 'Owner')
  const user = await account('user@regression.local', 'User')
  const workspaces = await rpc('getUserWorkspaces', {}, owner.token)
  const existing = workspaces.find((workspace: any) => workspace.name === 'Regressão simplificação')
  const ws = existing !== undefined
    ? await rpc('selectWorkspace', { workspaceUrl: existing.url }, owner.token)
    : await rpc('createWorkspace', {
      workspaceName: 'Regressão simplificação', region: 'regression', configuration: { withDemoContent: false }
    }, owner.token)
  const ownerWs = await rpc('selectWorkspace', { workspaceUrl: ws.workspaceUrl }, owner.token)
  let ready = false
  for (let attempt = 0; attempt < 120; attempt++) {
    if ((await rpc('getWorkspaceInfo', {}, ownerWs.token)).status.mode === 'active') {
      ready = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  assert.ok(ready, 'Local workspace did not become active within two minutes')
  let userWs
  try {
    userWs = await rpc('selectWorkspace', { workspaceUrl: ws.workspaceUrl }, user.token)
  } catch {
    const invite = await rpc('createInvite', {
      exp: 3600000, emailMask: 'user@regression.local', limit: 1, role: 'USER'
    }, ownerWs.token)
    await rpc('joinByToken', { inviteId: invite }, user.token)
    userWs = await rpc('selectWorkspace', { workspaceUrl: ws.workspaceUrl }, user.token)
  }
  assert.equal(ownerWs.role, 'OWNER')
  writeFileSync(statePath, JSON.stringify({ owner, user, ws, ownerWs, userWs }), { mode: 0o600 })
}

async function main (): Promise<void> {
  await initialize()
  const state = JSON.parse(readFileSync(statePath, 'utf8'))
  await rpc('updateWorkspaceRole', { targetAccount: state.user.account, targetRole: 'USER' }, state.ownerWs.token)
  const ownerRaw = await createClient('ws://localhost:30133', state.ownerWs.token, undefined, 30000)
  const userRaw = await createClient('ws://localhost:30133', state.userWs.token, undefined, 30000)
  const owner = new TxOperations(ownerRaw, state.owner.socialId)
  const user = new TxOperations(userRaw, state.user.socialId)
  const passed: string[] = []
  async function ensure<T extends Doc> (cls: Ref<Class<T>>, space: Ref<any>, id: string, data: Data<T>): Promise<Ref<T>> {
    const ref = id as Ref<T>
    if (await owner.findOne(cls, { _id: ref }) === undefined) {
      if (owner.getHierarchy().isDerived(cls, core.class.AttachedDoc)) {
        const { attachedTo, attachedToClass, collection, ...value } = data as any
        await owner.addCollection(cls as any, space, attachedTo, attachedToClass, collection, value, ref)
      } else {
        await owner.createDoc(cls, space, data, ref)
      }
    }
    return ref
  }
  try {
    const person = await ensure(contact.class.Person, contact.space.Contacts, 'regression-person-a', {
      name: 'Silva,Ana', avatarType: AvatarType.COLOR, city: 'Recife', remoteDaysPerWeek: 2, onsiteDaysPerWeek: 3
    })
    const other = await ensure(contact.class.Person, contact.space.Contacts, 'regression-person-b', {
      name: 'Silva,Anabela', avatarType: AvatarType.COLOR, city: 'Olinda'
    })
    const category = await ensure(tags.class.TagCategory, core.space.Workspace, 'regression-functions-category', {
      icon: tags.icon.Tags, label: 'Função', targetClass: contact.class.Person, tags: [], default: false
    })
    const tag = async (id: string, title: string): Promise<Ref<any>> => await ensure(tags.class.TagElement, core.space.Workspace, id, {
      title, description: '', color: 1, targetClass: contact.class.Person, category
    })
    const design = await tag('regression-tag-design', 'Designer')
    const writing = await tag('regression-tag-writing', 'Redação')
    const similar = await tag('regression-tag-design-similar', 'Designer sênior')
    const skill = await tag('regression-tag-skill', 'Svelte')
    const label = await tag('regression-tag-label', 'Equipe A')
    async function reference (id: string, attachedTo: Ref<any>, collection: string, tagId: Ref<any>, title: string): Promise<void> {
      if (await owner.findOne(tags.class.TagReference, { _id: id as Ref<any> }) === undefined) {
        await owner.addCollection(tags.class.TagReference, contact.space.Contacts, attachedTo, contact.class.Person, collection, {
          tag: tagId, title, color: 1
        }, id as Ref<any>)
      }
    }
    await reference('regression-ref-design-a', person, 'functions', design, 'Designer')
    await reference('regression-ref-writing-a', person, 'functions', writing, 'Redação')
    await reference('regression-ref-design-b', other, 'functions', design, 'Designer')
    await reference('regression-ref-similar-b', other, 'functions', similar, 'Designer sênior')
    await reference('regression-ref-skill-a', person, 'skills', skill, 'Svelte')
    await reference('regression-ref-label-a', person, 'labels', label, 'Equipe A')
    assert.equal((await user.findAll(tags.class.TagReference, { attachedTo: person, collection: 'functions' })).length, 2)
    assert.equal((await user.findAll(contact.class.Person, { name: { $like: '%ANA%' } })).length, 2)
    const days = await user.findOne(contact.class.Person, { _id: person })
    assert.equal(days?.remoteDaysPerWeek, 2)
    assert.equal(days?.onsiteDaysPerWeek, 3)
    passed.push('multiple functions, isolated collections, partial case-insensitive search and optional work days')

    const socials = await rpc('getSocialIds', {}, state.ownerWs.token)
    const ownerSocial = socials.find((s: any) => s.type === 'email')._id
    const publicCalendar = await ensure(calendar.class.Calendar, calendar.space.Calendar, 'regression-calendar-public', {
      name: 'Agenda compartilhada', hidden: false, visibility: 'public', user: ownerSocial, access: AccessLevel.Owner
    })
    const privateCalendar = await ensure(calendar.class.Calendar, calendar.space.Calendar, 'regression-calendar-private', {
      name: 'Agenda privada', hidden: false, visibility: 'private', user: ownerSocial, access: AccessLevel.Owner
    })
    const start = new Date(); start.setHours(10, 0, 0, 0)
    const event = async (id: string, title: string, calendarId: Ref<any>, visibility?: 'public' | 'private'): Promise<Ref<any>> => {
      if (await owner.findOne(calendar.class.Event, { _id: id as Ref<any> }) === undefined) {
        await owner.addCollection(calendar.class.Event, calendar.space.Calendar, person, contact.class.Person, 'events', {
          eventId: id, title, description: '<p>Descrição confidencial</p>', location: 'Local confidencial', calendar: calendarId,
          allDay: false, date: start.getTime(), dueDate: start.getTime() + 3600000, participants: [], visibility,
          access: AccessLevel.Owner, user: ownerSocial, blockTime: true
        }, id as Ref<any>)
      }
      return id as Ref<any>
    }
    await event('regression-event-secret', 'Segredo Owner', publicCalendar, 'private')
    await event('regression-event-public', 'Reunião pública', publicCalendar, 'public')
    await event('regression-event-inherited-private', 'Segredo agenda', privateCalendar)
    assert.equal((await user.findAll(calendar.class.Calendar, { _id: publicCalendar })).length, 1)
    passed.push('shared calendar and private/public event fixtures available to two accounts')

    const teamspace = await ensure(document.class.Teamspace, core.space.Space, 'regression-teamspace', {
      name: 'Diretrizes regressão', description: '', private: false, archived: false,
      members: [state.owner.account, state.user.account], type: document.spaceType.DefaultTeamspaceType
    })
    const doc = await ensure(document.class.Document, teamspace, 'regression-locked-document', {
      title: 'Diretriz bloqueada', content: null, parent: document.ids.NoParent, rank: '0|hzzzzz:', lockedBy: state.owner.account
    })
    await owner.updateDoc(document.class.Document, teamspace, doc, { lockedBy: state.owner.account })
    await assert.rejects(user.updateDoc(document.class.Document, teamspace, doc, { lockedBy: null }))
    await assert.rejects(user.updateDoc(document.class.Document, teamspace, doc, { $unset: { lockedBy: 1 } }))
    assert.equal((await owner.findOne(document.class.Document, { _id: doc }))?.lockedBy, state.owner.account)
    await owner.updateDoc(document.class.Document, teamspace, doc, { lockedBy: null })
    assert.equal((await user.findOne(document.class.Document, { _id: doc }))?.lockedBy, null)
    passed.push('User unlock rejected through null and $unset; Owner unlock persists')

    const sector = (await owner.findAll(tracker.class.Project, {}))[0]
    assert.ok(sector)
    const base = { title: 'Tarefa regressão', description: null, status: tracker.status.Backlog, priority: 0,
      component: null, attachedTo: tracker.ids.NoParent, attachedToClass: tracker.class.Issue, collection: 'subIssues',
      subIssues: 0, parents: [], estimation: 0, remainingTime: 0, reportedTime: 0, reports: 0, childInfo: [],
      kind: tracker.taskTypes.Issue, number: 901, identifier: 'TSK-901', rank: '0|hzzzzz:' }
    const parent = await ensure(tracker.class.Issue, sector._id, 'regression-parent-issue', base)
    const child = await ensure(tracker.class.Issue, sector._id, 'regression-child-issue', {
      ...base, title: 'Subtarefa regressão', number: 902, identifier: 'TSK-902', attachedTo: parent,
      parents: [{ parentId: parent, parentTitle: base.title, identifier: 'TSK-901', space: sector._id }]
    })
    await owner.updateDoc(tracker.class.Issue, sector._id, child, { status: tracker.status.InProgress })
    await owner.updateDoc(tracker.class.Issue, sector._id, child, { trackedTimeMs: 0, trackingStartedOn: Date.now() - 3600000 })
    await owner.updateDoc(tracker.class.Issue, sector._id, child, { status: tracker.status.Done })
    const done = await owner.findOne(tracker.class.Issue, { _id: child })
    assert.ok((done?.trackedTimeMs ?? 0) >= 3600000)
    assert.equal(done?.trackingStartedOn, null)
    assert.equal((await owner.findOne(tracker.class.Issue, { _id: parent }))?.childInfo.find(c => c.childId === child)?.trackedTimeMs, done?.trackedTimeMs)
    await owner.updateDoc(tracker.class.Issue, sector._id, child, { status: tracker.status.UnderReview })
    const reopened = await owner.findOne(tracker.class.Issue, { _id: child })
    assert.ok(reopened?.trackingStartedOn != null)
    assert.equal(reopened?.trackedTimeMs, done?.trackedTimeMs)
    passed.push('finished task accumulates time, parent snapshot matches and Review reopens interval')

    const floor = await ensure(love.class.Floor, core.space.Workspace, 'regression-floor', { name: 'Andar regressão' })
    const office = await ensure(love.class.Office, core.space.Workspace, 'regression-office', {
      name: 'Escritório regressão', floor, type: RoomType.Audio, access: RoomAccess.Open,
      width: 3, height: 3, x: 0, y: 0, language: 'pt-br', startWithRecording: false, description: null, person
    })
    await owner.updateDoc(love.class.Office, core.space.Workspace, office, { person: other })
    assert.equal((await user.findOne(love.class.Office, { _id: office }))?.person, other)
    await owner.updateDoc(love.class.Office, core.space.Workspace, office, { person })
    passed.push('office assignee changes persist and remain visible to second account')
    await userRaw.close()
    await rpc('updateWorkspaceRole', { targetAccount: state.user.account, targetRole: 'MAINTAINER' }, state.ownerWs.token)
    const maintainerRaw = await createClient('ws://localhost:30133', state.userWs.token, undefined, 30000)
    try {
      const maintainer = new TxOperations(maintainerRaw, state.user.socialId)
      await owner.updateDoc(document.class.Document, teamspace, doc, { lockedBy: state.owner.account })
      await maintainer.updateDoc(document.class.Document, teamspace, doc, { $unset: { lockedBy: 1 } })
      assert.equal((await owner.findOne(document.class.Document, { _id: doc }))?.lockedBy, undefined)
      passed.push('Maintainer unlock through $unset persists after reconnect')
    } finally {
      await maintainerRaw.close()
      await rpc('updateWorkspaceRole', { targetAccount: state.user.account, targetRole: 'USER' }, state.ownerWs.token)
    }
    const disposable = await tag('regression-tag-disposable', 'Designer temporário')
    await reference('regression-ref-disposable-a', person, 'functions', disposable, 'Designer temporário')
    await reference('regression-ref-disposable-b', other, 'functions', disposable, 'Designer temporário')
    await owner.removeDoc(tags.class.TagElement, core.space.Workspace, disposable)
    assert.equal((await owner.findAll(tags.class.TagReference, { tag: disposable })).length, 0)
    assert.equal((await owner.findAll(tags.class.TagReference, { attachedTo: person, collection: 'functions' })).length, 2)
    assert.equal((await owner.findAll(tags.class.TagReference, { attachedTo: person, collection: 'skills' })).length, 1)
    assert.equal((await owner.findAll(tags.class.TagReference, { attachedTo: person, collection: 'labels' })).length, 1)
    assert.ok(await owner.findOne(tags.class.TagElement, { _id: similar }))
    passed.push('deleting selected function removes its references across contacts and preserves similar functions, skills and labels')
    // Presentation must use references even when a legacy counter is stale.
    await owner.updateDoc(contact.class.Person, contact.space.Contacts, person, { functions: 0 })
    state.fixtures = { person, other, teamspace, doc, parent, child, office, floor, design, writing, skill, label, publicCalendar, privateCalendar }
    writeFileSync(statePath, JSON.stringify(state), { mode: 0o600 })
    writeFileSync('/tmp/teron-regression-api-results.json', JSON.stringify({ passed }, null, 2))
    console.log(JSON.stringify({ passed }, null, 2))
  } finally {
    await userRaw.close()
    await ownerRaw.close()
  }
}

void main().catch((err) => { console.error(err); process.exit(1) })
