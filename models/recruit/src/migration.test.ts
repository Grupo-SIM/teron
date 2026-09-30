import type { MigrationClient } from '@hcengineering/model'
import attachment, { DOMAIN_ATTACHMENT } from '@hcengineering/model-attachment'
import contact, { DOMAIN_CONTACT } from '@hcengineering/model-contact'
import { DOMAIN_TASK } from '@hcengineering/model-task'
import recruit from './plugin'
import { preserveApplicantFiles } from './migration'

describe('preserveApplicantFiles', () => {
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
})
