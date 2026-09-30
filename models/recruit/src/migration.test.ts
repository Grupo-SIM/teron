import type { MigrationClient } from '@hcengineering/model'
import { DOMAIN_MIGRATION } from '@hcengineering/core'
import attachment, { DOMAIN_ATTACHMENT } from '@hcengineering/model-attachment'
import contact, { DOMAIN_CONTACT } from '@hcengineering/model-contact'
import { DOMAIN_TASK } from '@hcengineering/model-task'
import recruit from './plugin'
import { ensureCandidateDataPreserved, preserveApplicantComments, preserveApplicantFiles, removeRecruitingRecords } from './migration'

describe('recruitment migration', () => {
  it('blocks cleanup until every preservation stage completed', async () => {
    const states = [
      'preserve-candidate-contact-fields-v1',
      'preserve-candidate-skills-v1',
      'preserve-applicant-files-v1',
      'preserve-applicant-comments-v1'
    ]
    const completed = states.slice(0, 3)
    const client = {
      find: async (domain: string) => {
        expect(domain).toBe(DOMAIN_MIGRATION)
        return completed.map((state) => ({ state }))
      }
    } as unknown as MigrationClient

    await expect(ensureCandidateDataPreserved(client)).rejects.toThrow('preserve-applicant-comments-v1')
    completed.push(states[3])
    await expect(ensureCandidateDataPreserved(client)).resolves.toBeUndefined()
  })

  it('moves applicant files to the selected person without touching another person and can run twice', async () => {
    const applicant = { _id: 'application-1', _class: recruit.class.Applicant, attachedTo: 'person-1' }
    const person = { _id: 'person-1', _class: contact.class.Person, space: 'contacts', attachments: 0 }
    const unrelated = { _id: 'person-2', _class: contact.class.Person, space: 'contacts', attachments: 1 }
    const files = [
      { _id: 'file-1', _class: attachment.class.Attachment, attachedTo: applicant._id, attachedToClass: recruit.class.Applicant, collection: 'attachments', space: 'applications' },
      { _id: 'file-2', _class: attachment.class.Attachment, attachedTo: unrelated._id, attachedToClass: contact.class.Person, collection: 'attachments', space: 'contacts' }
    ]
    const client = {
      traverse: async (domain: string) => {
        expect(domain).toBe(DOMAIN_TASK)
        let delivered = false
        return {
          next: async () => {
            if (delivered) return null
            delivered = true
            return [applicant]
          },
          close: async () => {}
        }
      },
      find: async (domain: string, query: { _id?: string, attachedTo?: string }) => {
        if (domain === DOMAIN_CONTACT) return query._id === person._id ? [person] : []
        if (domain === DOMAIN_ATTACHMENT) return files.filter((file) => file.attachedTo === query.attachedTo)
        return []
      },
      update: async (domain: string, query: { _id?: string, attachedTo?: string }, changes: Record<string, unknown>) => {
        if (domain === DOMAIN_CONTACT && query._id === person._id) Object.assign(person, changes)
        if (domain === DOMAIN_ATTACHMENT) {
          files.filter((file) => file.attachedTo === query.attachedTo).forEach((file) => Object.assign(file, changes))
        }
      }
    } as unknown as MigrationClient

    await preserveApplicantFiles(client)
    await preserveApplicantFiles(client)

    expect(files[0]).toMatchObject({ attachedTo: person._id, attachedToClass: contact.class.Person, space: person.space })
    expect(files[1]).toMatchObject({ attachedTo: unrelated._id, attachedToClass: contact.class.Person })
    expect(person.attachments).toBe(1)
    expect(unrelated.attachments).toBe(1)
  })

  it('keeps applicant comments as read-only contact activity on repeated migration', async () => {
    const applicant = { _id: 'application-2', _class: recruit.class.Applicant, attachedTo: 'person-3' }
    const person = { _id: 'person-3', _class: contact.class.Person, space: 'contacts', comments: 0 }
    const comments = [
      { _id: 'note-1', attachedTo: applicant._id, attachedToClass: recruit.class.Applicant, collection: 'comments', space: 'applications' },
      { _id: 'note-2', attachedTo: 'person-4', attachedToClass: contact.class.Person, collection: 'comments', space: 'contacts' }
    ]
    const client = {
      traverse: async () => {
        let delivered = false
        return {
          next: async () => {
            if (delivered) return null
            delivered = true
            return [applicant]
          },
          close: async () => {}
        }
      },
      find: async (domain: string, query: { _id?: string, attachedTo?: string }) => {
        if (domain === DOMAIN_CONTACT) return query._id === person._id ? [person] : []
        if (domain === 'activity') return comments.filter((comment) => comment.attachedTo === query.attachedTo)
        return []
      },
      update: async (domain: string, query: { _id?: string, attachedTo?: string }, changes: Record<string, unknown>) => {
        if (domain === DOMAIN_CONTACT && query._id === person._id) Object.assign(person, changes)
        if (domain === 'activity') {
          comments.filter((comment) => comment.attachedTo === query.attachedTo).forEach((comment) => Object.assign(comment, changes))
        }
      }
    } as unknown as MigrationClient

    await preserveApplicantComments(client)
    await preserveApplicantComments(client)

    expect(comments[0]).toMatchObject({ attachedTo: person._id, attachedToClass: contact.class.Person, space: person.space })
    expect(comments[1]).toMatchObject({ attachedTo: 'person-4', attachedToClass: contact.class.Person })
    expect(person.comments).toBe(1)
  })

  it('deletes only recruiting records and their own linked data, including on a repeated run', async () => {
    type Row = { _id: string, _class?: string, attachedTo?: string, objectId?: string }
    const docs: Record<string, Row[]> = {
      task: [
        { _id: 'application-5', _class: recruit.class.Applicant },
        { _id: 'match-5', _class: recruit.class.ApplicantMatch },
        { _id: 'issue-5', _class: 'tracker:class:Issue' }
      ],
      space: [
        { _id: 'vacancy-5', _class: recruit.class.Vacancy },
        { _id: 'project-5', _class: 'tracker:class:Project' }
      ],
      event: [{ _id: 'review-5', _class: recruit.class.Review }],
      recruit: [{ _id: 'opinion-5', _class: recruit.class.Opinion }],
      attachment: [
        { _id: 'old-file', attachedTo: 'vacancy-5' },
        { _id: 'person-file', attachedTo: 'person-5' }
      ],
      activity: [
        { _id: 'old-activity', attachedTo: 'application-5' },
        { _id: 'person-activity', attachedTo: 'person-5' }
      ],
      notification: [{ _id: 'old-notification', attachedTo: 'review-5' }],
      'notification-user': [{ _id: 'old-user-notification', attachedTo: 'review-5' }],
      'notification-dnc': [{ _id: 'old-context', objectId: 'application-5' }],
      tags: [
        { _id: 'old-tag', attachedTo: 'vacancy-5' },
        { _id: 'person-tag', attachedTo: 'person-5' }
      ],
      tx: [{ _id: 'old-tx', objectId: 'application-5' }]
    }
    const client = {
      find: async (domain: string, query: { _class?: string }) =>
        (docs[domain] ?? []).filter((row) => row._class === query._class).slice(0, 100),
      deleteMany: async (domain: string, query: { _class?: string, _id?: { $in: string[] }, attachedTo?: { $in: string[] }, objectId?: { $in: string[] } }) => {
        docs[domain] = (docs[domain] ?? []).filter((row) => {
          if (query._class !== undefined && row._class !== query._class) return true
          if (query._id !== undefined) return !query._id.$in.includes(row._id)
          if (query.attachedTo !== undefined) return !query.attachedTo.$in.includes(row.attachedTo ?? '')
          if (query.objectId !== undefined) return !query.objectId.$in.includes(row.objectId ?? '')
          return true
        })
      }
    } as unknown as MigrationClient

    await removeRecruitingRecords(client)
    await removeRecruitingRecords(client)

    expect(docs.task.map((row) => row._id)).toEqual(['issue-5'])
    expect(docs.space.map((row) => row._id)).toEqual(['project-5'])
    expect(docs.event).toEqual([])
    expect(docs.recruit).toEqual([])
    expect(docs.attachment.map((row) => row._id)).toEqual(['person-file'])
    expect(docs.activity.map((row) => row._id)).toEqual(['person-activity'])
    expect(docs.notification).toEqual([])
    expect(docs['notification-user']).toEqual([])
    expect(docs['notification-dnc']).toEqual([])
    expect(docs.tags.map((row) => row._id)).toEqual(['person-tag'])
    expect(docs.tx.map((row) => row._id)).toEqual(['old-tx'])
  })
})
