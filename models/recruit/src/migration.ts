//
// Copyright © 2022 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { getCategories } from '@anticrm/skillset'
import core, {
  DOMAIN_MODEL_TX,
  toIdMap,
  TxOperations,
  type Domain,
  type Doc,
  type Ref,
  type Space,
  type Status
} from '@hcengineering/core'
import {
  createOrUpdate,
  migrateSpace,
  tryMigrate,
  tryUpgrade,
  type MigrateOperation,
  type MigrationClient,
  type MigrationDocumentQuery,
  type MigrationUpgradeClient,
  type ModelLogger
} from '@hcengineering/model'
import attachment, { DOMAIN_ATTACHMENT } from '@hcengineering/model-attachment'
import tags, { DOMAIN_TAGS, type TagCategory } from '@hcengineering/model-tags'
import task, { createSequence, DOMAIN_TASK, migrateDefaultStatusesBase } from '@hcengineering/model-task'
import { recruitId, type Applicant, type Candidate } from '@hcengineering/recruit'

import { DOMAIN_CALENDAR } from '@hcengineering/model-calendar'
import contact, { DOMAIN_CONTACT } from '@hcengineering/model-contact'
import { type Person } from '@hcengineering/contact'
import { DOMAIN_SPACE } from '@hcengineering/model-core'
import recruit from './plugin'
import { defaultApplicantStatuses } from './spaceType'
import { candidateContactUpdate } from './candidate-contact'

export const recruitOperation: MigrateOperation = {
  async preMigrate (client: MigrationClient, logger: ModelLogger, mode): Promise<void> {
    await tryMigrate(mode, client, recruitId, [
      {
        state: 'migrate-default-statuses',
        func: (client) => migrateDefaultStatuses(client, logger)
      }
    ])
  },
  async migrate (client: MigrationClient, mode): Promise<void> {
    await tryMigrate(mode, client, recruitId, [
      {
        state: 'identifier',
        mode: 'upgrade',
        func: migrateIdentifiers
      },
      {
        state: 'migrate-default-type-mixins',
        func: async (client) => {
          await migrateDefaultTypeMixins(client)
        }
      },
      {
        state: 'removeDeprecatedSpace',
        func: async (client: MigrationClient) => {
          await migrateSpace(client, 'recruit:space:Reviews' as Ref<Space>, core.space.Workspace, [DOMAIN_CALENDAR])
        }
      },
      {
        state: 'migrate-applicants',
        mode: 'upgrade',
        func: async (client: MigrationClient) => {
          await client.update(
            DOMAIN_TASK,
            { _class: recruit.class.Applicant, isDone: { $nin: [false, true] } },
            { isDone: false }
          )
        }
      },
      {
        state: 'preserve-candidate-contact-fields-v1',
        mode: 'upgrade',
        func: preserveCandidateContactFields
      },
      {
        state: 'preserve-candidate-skills-v1',
        mode: 'upgrade',
        func: preserveCandidateSkills
      },
      {
        state: 'preserve-applicant-files-v1',
        mode: 'upgrade',
        func: preserveApplicantFiles
      },
      {
        state: 'preserve-applicant-comments-v1',
        mode: 'upgrade',
        func: preserveApplicantComments
      }
    ])
  },
  async upgrade (state: Map<string, Set<string>>, client: () => Promise<MigrationUpgradeClient>, mode): Promise<void> {
    await tryUpgrade(mode, state, client, recruitId, [
      {
        state: 'create-defaults-v2',
        func: async (client) => {
          const tx = new TxOperations(client, core.account.System)
          await createDefaults(client, tx)
        }
      }
    ])
  }
}

export async function preserveApplicantFiles (client: MigrationClient): Promise<void> {
  const applicants = await client.traverse<Applicant>(DOMAIN_TASK, { _class: recruit.class.Applicant })
  try {
    while (true) {
      const batch = await applicants.next(100)
      if (batch === null || batch.length === 0) break
      for (const applicant of batch) {
        const [candidate] = await client.find<Person>(DOMAIN_CONTACT, {
          _id: applicant.attachedTo,
          _class: contact.class.Person
        } as MigrationDocumentQuery<Person>)
        if (candidate === undefined) continue

        await client.update(DOMAIN_ATTACHMENT, {
          _class: attachment.class.Attachment,
          attachedTo: applicant._id,
          attachedToClass: recruit.class.Applicant
        }, {
          attachedTo: candidate._id,
          attachedToClass: contact.class.Person,
          collection: 'attachments',
          space: candidate.space
        })

        const files = await client.find(DOMAIN_ATTACHMENT, {
          _class: attachment.class.Attachment,
          attachedTo: candidate._id,
          attachedToClass: contact.class.Person,
          collection: 'attachments'
        })
        if (candidate.attachments !== files.length) {
          await client.update(DOMAIN_CONTACT, { _id: candidate._id }, { attachments: files.length })
        }
      }
    }
  } finally {
    await applicants.close()
  }
}

export async function preserveApplicantComments (client: MigrationClient): Promise<void> {
  const activityDomain = 'activity' as Domain
  const applicants = await client.traverse<Applicant>(DOMAIN_TASK, { _class: recruit.class.Applicant })
  try {
    while (true) {
      const batch = await applicants.next(100)
      if (batch === null || batch.length === 0) break
      for (const applicant of batch) {
        const [candidate] = await client.find<Person>(DOMAIN_CONTACT, {
          _id: applicant.attachedTo,
          _class: contact.class.Person
        } as MigrationDocumentQuery<Person>)
        if (candidate === undefined) continue

        await client.update(activityDomain, {
          attachedTo: applicant._id,
          attachedToClass: recruit.class.Applicant,
          collection: 'comments'
        }, {
          attachedTo: candidate._id,
          attachedToClass: contact.class.Person,
          space: candidate.space
        })

        const comments = await client.find(activityDomain, {
          attachedTo: candidate._id,
          attachedToClass: contact.class.Person,
          collection: 'comments'
        })
        if (candidate.comments !== comments.length) {
          await client.update(DOMAIN_CONTACT, { _id: candidate._id }, { comments: comments.length })
        }
      }
    }
  } finally {
    await applicants.close()
  }
}

async function preserveCandidateContactFields (client: MigrationClient): Promise<void> {
  const iterator = await client.traverse<Person>(DOMAIN_CONTACT, {
    _class: contact.class.Person,
    [recruit.mixin.Candidate]: { $exists: true }
  } as MigrationDocumentQuery<Person>)
  try {
    while (true) {
      const people = await iterator.next(100)
      if (people === null || people.length === 0) break
      for (const person of people) {
        const candidate = (person as Person & Record<string, unknown>)[recruit.mixin.Candidate] as Partial<Candidate> | undefined
        const update = candidateContactUpdate(person, candidate)
        if (Object.keys(update).length > 0) {
          await client.update(DOMAIN_CONTACT, { _id: person._id }, update)
        }
      }
    }
  } finally {
    await iterator.close()
  }
}

async function preserveCandidateSkills (client: MigrationClient): Promise<void> {
  const iterator = await client.traverse<Person>(DOMAIN_CONTACT, {
    _class: contact.class.Person,
    [recruit.mixin.Candidate]: { $exists: true }
  } as MigrationDocumentQuery<Person>)
  try {
    while (true) {
      const people = await iterator.next(100)
      if (people === null || people.length === 0) break
      for (const person of people) {
        const candidate = (person as Person & Record<string, unknown>)[recruit.mixin.Candidate] as Partial<Candidate> | undefined
        if (person.skills === undefined && candidate?.skills !== undefined) {
          await client.update(DOMAIN_CONTACT, { _id: person._id }, { skills: candidate.skills })
        }
      }
    }
  } finally {
    await iterator.close()
  }

  await client.update(DOMAIN_TAGS, {
    _class: tags.class.TagReference,
    attachedToClass: recruit.mixin.Candidate,
    collection: 'skills'
  }, {
    attachedToClass: contact.class.Person
  })
  await client.update(DOMAIN_TAGS, {
    _class: tags.class.TagElement,
    targetClass: recruit.mixin.Candidate
  }, {
    targetClass: contact.class.Person
  })
  await client.update(DOMAIN_TAGS, {
    _class: tags.class.TagCategory,
    targetClass: recruit.mixin.Candidate
  }, {
    targetClass: contact.class.Person
  })
}

async function migrateIdentifiers (client: MigrationClient): Promise<void> {
  const docs = await client.find<Applicant>(DOMAIN_TASK, {
    _class: recruit.class.Applicant,
    identifier: { $exists: false }
  })
  for (const doc of docs) {
    await client.update(
      DOMAIN_TASK,
      { _id: doc._id },
      {
        identifier: `APP-${doc.number}`
      }
    )
  }
}

async function migrateDefaultStatuses (client: MigrationClient, logger: ModelLogger): Promise<void> {
  const defaultTypeId = recruit.template.DefaultVacancy
  const typeDescriptor = recruit.descriptors.VacancyType
  const baseClass = recruit.class.Vacancy
  const defaultTaskTypeId = recruit.taskTypes.Applicant
  const taskTypeClass = task.class.TaskType
  const baseTaskClass = recruit.class.Applicant
  const statusAttributeOf = recruit.attribute.State
  const statusClass = core.class.Status
  const getDefaultStatus = (oldStatus: Status): Ref<Status> | undefined => {
    return defaultApplicantStatuses.find(
      (defStatus) =>
        defStatus.category === oldStatus.category &&
        defStatus.name.toLowerCase() === oldStatus.name.trim().toLowerCase()
    )?.id
  }

  await migrateDefaultStatusesBase<Applicant>(
    client,
    logger,
    defaultTypeId,
    typeDescriptor,
    baseClass,
    defaultTaskTypeId,
    taskTypeClass,
    baseTaskClass,
    statusAttributeOf,
    statusClass,
    getDefaultStatus
  )
}

async function migrateDefaultTypeMixins (client: MigrationClient): Promise<void> {
  const oldSpaceTypeMixin = `${recruit.template.DefaultVacancy}:type:mixin`
  const newSpaceTypeMixin = recruit.mixin.DefaultVacancyTypeData
  const oldTaskTypeMixin = `${recruit.taskTypes.Applicant}:type:mixin`
  const newTaskTypeMixin = recruit.mixin.ApplicantTypeData

  await client.update(
    DOMAIN_MODEL_TX,
    {
      objectClass: core.class.Attribute,
      'attributes.attributeOf': oldSpaceTypeMixin
    },
    {
      'attributes.attributeOf': newSpaceTypeMixin
    }
  )

  await client.update(
    DOMAIN_SPACE,
    {
      _class: recruit.class.Vacancy,
      [oldSpaceTypeMixin]: { $exists: true }
    },
    {
      $rename: {
        [oldSpaceTypeMixin]: newSpaceTypeMixin
      }
    }
  )

  await client.update(
    DOMAIN_TASK,
    {
      _class: recruit.class.Applicant,
      [oldTaskTypeMixin]: { $exists: true }
    },
    {
      $rename: {
        [oldTaskTypeMixin]: newTaskTypeMixin
      }
    }
  )
}

async function createDefaults (client: MigrationUpgradeClient, tx: TxOperations): Promise<void> {
  await createOrUpdate(
    tx,
    tags.class.TagCategory,
    core.space.Workspace,
    {
      icon: recruit.icon.Skills,
      label: 'Other',
      targetClass: contact.class.Person,
      tags: [],
      default: true
    },
    recruit.category.Other
  )
  const ops = tx.apply()

  const cats = getCategories().filter((it, idx, arr) => arr.findIndex((qt) => qt.id === it.id) === idx)

  const existingCategories = toIdMap(
    await client.findAll<Doc>(tags.class.TagCategory, { targetClass: contact.class.Person })
  )
  for (const c of cats) {
    await createOrUpdate(
      ops,
      tags.class.TagCategory,
      core.space.Workspace,
      {
        icon: recruit.icon.Skills,
        label: c.label,
        targetClass: contact.class.Person,
        tags: c.skills,
        default: false
      },
      (recruit.category.Category + '.' + c.id) as Ref<TagCategory>,
      existingCategories
    )
  }
  await ops.commit()

  await createSequence(tx, recruit.class.Review)
  await createSequence(tx, recruit.class.Opinion)
  await createSequence(tx, recruit.class.Applicant)
  await createSequence(tx, recruit.class.Vacancy)
}
