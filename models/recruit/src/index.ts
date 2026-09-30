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

import activity from '@hcengineering/activity'
import { type ClassCollaborators, SortingOrder, type Lookup, type Ref } from '@hcengineering/core'
import { type Builder } from '@hcengineering/model'
import chunter from '@hcengineering/model-chunter'
import contact from '@hcengineering/model-contact'
import core from '@hcengineering/model-core'
import { generateClassNotificationTypes } from '@hcengineering/model-notification'
import tags from '@hcengineering/model-tags'
import task from '@hcengineering/model-task'
import tracker from '@hcengineering/model-tracker'
import view, { showColorsViewOption } from '@hcengineering/model-view'
import workbench from '@hcengineering/model-workbench'
import notification from '@hcengineering/notification'
import { type Applicant, type Vacancy } from '@hcengineering/recruit'
import setting from '@hcengineering/setting'
import { type ViewOptionModel, type ViewOptionsModel } from '@hcengineering/view'

import recruit from './plugin'
import { defineSpaceType } from './spaceType'
import { definePermissions } from './permissions'
import { TApplicant, TApplicantMatch, TCandidate, TOpinion, TReview, TVacancy, TVacancyList } from './types'

export { recruitId } from '@hcengineering/recruit'
export { recruitOperation } from './migration'
export { default } from './plugin'
export * from './spaceType'
export * from './types'

export function createModel (builder: Builder): void {
  builder.createModel(TVacancy, TCandidate, TApplicant, TReview, TOpinion, TVacancyList, TApplicantMatch)

  builder.mixin(recruit.class.Vacancy, core.class.Class, activity.mixin.ActivityDoc, {})
  builder.mixin(recruit.class.Applicant, core.class.Class, activity.mixin.ActivityDoc, {})
  builder.mixin(recruit.class.Review, core.class.Class, activity.mixin.ActivityDoc, {})
  builder.mixin(recruit.mixin.Candidate, core.class.Class, activity.mixin.ActivityDoc, {})

  builder.createDoc(activity.class.ActivityExtension, core.space.Model, {
    ofClass: recruit.class.Vacancy,
    components: { input: { component: chunter.component.ChatMessageInput } }
  })

  builder.createDoc(activity.class.ActivityExtension, core.space.Model, {
    ofClass: recruit.class.Applicant,
    components: { input: { component: chunter.component.ChatMessageInput } }
  })

  builder.createDoc(activity.class.ActivityExtension, core.space.Model, {
    ofClass: recruit.class.Review,
    components: { input: { component: chunter.component.ChatMessageInput } }
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, workbench.mixin.SpaceView, {
    view: {
      class: recruit.class.Applicant,
      createItemDialog: recruit.component.CreateApplication,
      createItemLabel: recruit.string.ApplicationCreateLabel
    }
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.CollectionEditor, {
    editor: recruit.component.Applications
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.CollectionEditor, {
    editor: recruit.component.VacancyList
  })

  builder.createDoc<ClassCollaborators<Vacancy>>(core.class.ClassCollaborators, core.space.Model, {
    attachedTo: recruit.class.Vacancy,
    fields: ['createdBy']
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.AttributeEditor, {
    inlineEditor: recruit.component.VacancyEditor
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.ArrayEditor, {
    inlineEditor: view.component.ArrayEditor
  })

  builder.createDoc<ClassCollaborators<Applicant>>(core.class.ClassCollaborators, core.space.Model, {
    attachedTo: recruit.class.Applicant,
    fields: ['createdBy', 'assignee']
  })

  builder.mixin(recruit.mixin.Candidate, core.class.Mixin, view.mixin.ObjectFactory, {
    component: recruit.component.CreateCandidate
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, setting.mixin.Editable, {
    value: true
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, setting.mixin.Editable, {
    value: true
  })
  builder.mixin(recruit.mixin.VacancyList, core.class.Class, setting.mixin.Editable, {
    value: false
  })

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.mixin.Candidate,
      descriptor: view.viewlet.Table,
      config: [
        '',
        'title',
        'city',
        'applications',
        'attachments',
        'comments',
        {
          // key: '$lookup.skills', // Required, since presenter require list of tag references or '' and TagsPopupPresenter
          key: '',
          presenter: tags.component.TagsPresenter,
          label: recruit.string.SkillsLabel,
          sortingKey: 'skills',
          props: {
            _class: recruit.mixin.Candidate,
            key: 'skills',
            icon: recruit.icon.Skills
          }
        },
        'modifiedOn',
        {
          key: '$lookup.channels',
          label: contact.string.ContactInfo,
          sortingKey: ['$lookup.channels.lastMessage', 'channels']
        }
      ],
      configOptions: {
        hiddenKeys: ['name'],
        sortable: true
      }
    },
    recruit.viewlet.TableCandidate
  )

  const tableCandidateExportConfig = {
    skipAttributes: ['_class', 'avatarType', 'space'],
    attributeKeyMap: { city: 'location' },
    attributeTransforms: {
      channels: {
        operations: [
          {
            type: 'group_by',
            config: {
              keyField: 'data.provider',
              valueField: 'data.value'
            }
          },
          {
            type: 'join',
            config: {
              delimiter: ', '
            }
          }
        ]
      }
    }
  }
  builder.createDoc(
    view.class.ViewletViewAction,
    core.space.Model,
    {
      descriptor: view.viewlet.Table,
      extension: workbench.extensions.SpecialViewAction,
      config: tableCandidateExportConfig,
      applicableToClass: recruit.mixin.Candidate
    },
    recruit.specialViewAction.TableCandidate
  )

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.class.Applicant,
      descriptor: view.viewlet.Table,
      config: ['', '$lookup.attachedTo', 'status', 'modifiedOn'],
      configOptions: {
        sortable: true
      },
      variant: 'short'
    },
    recruit.viewlet.VacancyApplicationsShort
  )

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.class.Applicant,
      descriptor: view.viewlet.Table,
      config: ['', '$lookup.space.name', '$lookup.space.$lookup.company', 'status', 'comments'],
      configOptions: {
        sortable: true
      },
      variant: 'embedded'
    },
    recruit.viewlet.VacancyApplicationsEmbeddeed
  )

  // hiding arhived vacancies from vacancy view
  const vacancyHideArchivedOption: ViewOptionModel = {
    key: 'hideArchived',
    type: 'toggle',
    defaultValue: true,
    actionTarget: 'options',
    action: view.function.HideArchived,
    label: view.string.HideArchived
  }

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.class.Vacancy,
      descriptor: view.viewlet.Table,
      config: [
        '',
        {
          key: '@applications',
          label: recruit.string.Applications
        },
        'comments',
        '$lookup.company',
        '$lookup.company.$lookup.channels',
        {
          key: '@applications.modifiedOn',
          label: core.string.ModifiedDate
        }
      ],
      configOptions: {
        hiddenKeys: ['name', 'space', 'modifiedOn', 'company'],
        sortable: true
      },
      viewOptions: {
        groupBy: [],
        orderBy: [],
        other: [vacancyHideArchivedOption],
        storageKey: 'vacancyViewOptions'
      }
    },
    recruit.viewlet.TableVacancy
  )
  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.mixin.VacancyList,
      descriptor: view.viewlet.Table,
      config: [
        {
          key: '',
          label: recruit.string.Organizations
        },
        {
          key: '@vacancies',
          label: recruit.string.Vacancies
        },
        {
          key: '@applications',
          label: recruit.string.Applications
        },
        'comments',
        '$lookup.channels',
        {
          key: '@applications.modifiedOn',
          label: core.string.ModifiedDate
        }
      ],
      configOptions: {
        hiddenKeys: ['name', 'space', 'modifiedOn'],
        sortable: true
      }
    },
    recruit.viewlet.TableVacancyList
  )

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.class.Applicant,
      descriptor: task.viewlet.StatusTable,
      config: [
        '',
        {
          key: '$lookup.attachedTo',
          presenter: contact.component.PersonPresenter,
          sortingKey: '$lookup.attachedTo.name',
          label: recruit.string.Talent,
          props: {
            _class: recruit.mixin.Candidate
          }
        },
        'assignee',
        'status',
        'attachments',
        'comments',
        'modifiedOn',
        {
          key: '$lookup.attachedTo.$lookup.channels',
          label: contact.string.ContactInfo,
          sortingKey: ['$lookup.attachedTo.$lookup.channels.lastMessage', '$lookup.attachedTo.channels']
        }
      ],
      configOptions: {
        hiddenKeys: ['name', 'attachedTo'],
        sortable: true
      },
      viewOptions: {
        groupBy: [],
        orderBy: [],
        other: [vacancyHideArchivedOption],
        storageKey: 'vacancyViewOptions'
      }
    },
    recruit.viewlet.TableApplicant
  )

  const applicationDoneOption: ViewOptionModel = {
    key: 'hideDoneState',
    type: 'toggle',
    defaultValue: true,
    actionTarget: 'query',
    action: recruit.function.HideDoneState,
    label: recruit.string.HideDoneState
  }

  // hiding applicants related to archived vacancies from applicants view
  const hideApplicantsFromArchivedVacanciesOption: ViewOptionModel = {
    key: 'hideArchivedVacancies',
    type: 'toggle',
    defaultValue: true,
    actionTarget: 'options',
    action: view.function.HideArchived,
    label: recruit.string.HideApplicantsFromArchivedVacancies
  }

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.class.Applicant,
      descriptor: view.viewlet.Table,
      config: [
        '',
        {
          key: '$lookup.attachedTo',
          presenter: contact.component.PersonPresenter,
          label: recruit.string.Talent,
          sortingKey: '$lookup.attachedTo.name',
          props: {
            _class: recruit.mixin.Candidate
          }
        },
        'assignee',
        'status',
        'attachments',
        'comments',
        {
          key: '',
          label: tracker.string.RelatedIssues,
          presenter: tracker.component.RelatedIssueSelector,
          displayProps: { key: 'related', suffix: true }
        },
        'modifiedOn',
        '$lookup.space.company',
        {
          key: '$lookup.attachedTo.$lookup.channels',
          label: contact.string.ContactInfo,
          sortingKey: ['$lookup.attachedTo.$lookup.channels.lastMessage', '$lookup.attachedTo.channels']
        }
      ],
      options: {
        lookup: {
          space: recruit.class.Vacancy
        }
      },
      configOptions: {
        hiddenKeys: ['name', 'attachedTo'],
        sortable: true
      },
      viewOptions: {
        groupBy: [],
        orderBy: [],
        other: [applicationDoneOption, hideApplicantsFromArchivedVacanciesOption],
        storageKey: 'applicantViewOptions'
      }
    },
    recruit.viewlet.ApplicantTable
  )

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.class.ApplicantMatch,
      descriptor: view.viewlet.Table,
      config: ['', 'response', 'attachedTo', 'space', 'modifiedOn'],
      options: {
        lookup: {
          space: recruit.class.Vacancy
        }
      },
      baseQuery: {
        isDone: false
      }
    },
    recruit.viewlet.TableApplicantMatch
  )

  const applicantKanbanLookup: Lookup<Applicant> = {
    attachedTo: [
      recruit.mixin.Candidate,
      {
        _id: {
          channels: contact.class.Channel
        },
        space: recruit.class.Vacancy
      }
    ]
  }

  const applicantViewOptions = (colors: boolean, hides: boolean): ViewOptionsModel => {
    const model: ViewOptionsModel = {
      groupBy: ['status', 'assignee', 'space', 'createdBy', 'modifiedBy'],
      orderBy: [
        ['status', SortingOrder.Ascending],
        ['modifiedOn', SortingOrder.Descending],
        ['createdOn', SortingOrder.Descending],
        ['dueDate', SortingOrder.Ascending],
        ['rank', SortingOrder.Ascending]
      ],
      other: [
        {
          key: 'shouldShowAll',
          type: 'toggle',
          defaultValue: false,
          actionTarget: 'category',
          action: view.function.ShowEmptyGroups,
          label: view.string.ShowEmptyGroups
        },
        vacancyHideArchivedOption
      ],
      storageKey: 'applicantViewOptions'
    }
    if (colors) {
      model.other.push(showColorsViewOption)
    }
    if (hides) {
      model.other.push(...[applicationDoneOption, hideApplicantsFromArchivedVacanciesOption])
    }
    return model
  }

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.class.Applicant,
      descriptor: view.viewlet.List,
      config: [
        { key: '', displayProps: { fixed: 'left', key: 'app' } },
        {
          key: 'status',
          props: { kind: 'list', size: 'small', shouldShowName: false }
        },
        {
          key: 'kind',
          label: task.string.TaskType,
          presenter: task.component.TaskTypeListPresenter,
          props: { kind: 'list', size: 'small', justify: 'center' },
          displayProps: { key: 'applicant_kind' }
        },
        {
          key: '$lookup.attachedTo',
          presenter: contact.component.PersonPresenter,
          label: recruit.string.Talent,
          sortingKey: '$lookup.attachedTo.name',
          props: {
            _class: recruit.mixin.Candidate
          }
        },
        { key: 'attachments', displayProps: { key: 'attachments', suffix: true } },
        { key: 'comments', displayProps: { key: 'comments', suffix: true } },
        {
          key: '',
          label: tracker.string.RelatedIssues,
          presenter: tracker.component.RelatedIssueSelector,
          displayProps: { key: 'related', suffix: true }
        },
        { key: '', displayProps: { grow: true } },
        {
          key: '$lookup.space.company',
          displayProps: { fixed: 'left', key: 'company' },
          props: {
            maxWidth: '10rem'
          }
        },
        {
          key: '$lookup.attachedTo.$lookup.channels',
          label: contact.string.ContactInfo,
          sortingKey: ['$lookup.attachedTo.$lookup.channels.lastMessage', '$lookup.attachedTo.channels'],
          props: {
            length: 'full',
            size: 'small',
            kind: 'list'
          },
          displayProps: { compression: true }
        },
        { key: 'modifiedOn', displayProps: { key: 'modified', fixed: 'right', dividerBefore: true } },
        {
          key: 'assignee',
          props: { kind: 'list', shouldShowName: false, avatarSize: 'x-small' },
          displayProps: { key: 'assignee', fixed: 'right' }
        },
        {
          key: '',
          label: recruit.string.DueDate,
          presenter: tracker.component.DueDatePresenter,
          displayProps: { key: 'dueDate', compression: true },
          props: { kind: 'list' }
        }
      ],
      options: {
        lookup: {
          space: recruit.class.Vacancy
        }
      },
      configOptions: {
        strict: true,
        hiddenKeys: ['name', 'attachedTo']
      },
      viewOptions: applicantViewOptions(true, true)
    },
    recruit.viewlet.ListApplicant
  )

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.mixin.Candidate,
      descriptor: view.viewlet.List,
      config: [
        { key: '', displayProps: { fixed: 'left', key: 'app' } },
        {
          key: 'title',
          props: { kind: 'list', size: 'small', shouldShowName: false }
        },
        'comments',
        { key: '', displayProps: { grow: true } },
        {
          key: '$lookup.channels',
          label: contact.string.ContactInfo,
          sortingKey: ['$lookup.channels.lastMessage', '$lookup.attachedTo.channels'],
          props: {
            length: 'full',
            size: 'small',
            kind: 'list'
          },
          displayProps: { compression: true }
        },
        { key: 'modifiedOn', displayProps: { key: 'modified', fixed: 'right', dividerBefore: true } }
      ],
      configOptions: {
        strict: true,
        hiddenKeys: ['name']
      },
      viewOptions: {
        groupBy: ['createdBy', 'modifiedBy'],
        orderBy: [
          ['modifiedOn', SortingOrder.Descending],
          ['createdOn', SortingOrder.Descending],
          ['rank', SortingOrder.Ascending]
        ],
        other: [showColorsViewOption]
      }
    },
    recruit.viewlet.ListTalent
  )

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.mixin.VacancyList,
      descriptor: view.viewlet.List,
      config: [
        { key: '', displayProps: { fixed: 'left', key: 'app' } },
        {
          key: '@vacancies',
          label: recruit.string.Vacancies,
          props: { kind: 'list', size: 'small', shouldShowName: false }
        },
        {
          key: '@applications',
          label: recruit.string.Applications,
          props: { kind: 'list', size: 'small', shouldShowName: false }
        },
        'comments',
        {
          key: '$lookup.channels',
          label: contact.string.ContactInfo,
          sortingKey: ['$lookup.channels.lastMessage', '$lookup.attachedTo.channels'],
          props: {
            length: 'full',
            size: 'small',
            kind: 'list'
          },
          displayProps: { compression: true }
        },
        { key: '', displayProps: { grow: true } },
        {
          key: '@applications.modifiedOn',
          label: core.string.ModifiedDate,
          displayProps: { key: 'modified', fixed: 'right', dividerBefore: true }
        }
      ],
      configOptions: {
        strict: true,
        sortable: true,
        hiddenKeys: ['name', 'space', 'modifiedOn']
      },
      viewOptions: {
        groupBy: ['createdBy', 'modifiedBy'],
        orderBy: [
          ['modifiedOn', SortingOrder.Descending],
          ['createdOn', SortingOrder.Descending],
          ['rank', SortingOrder.Ascending]
        ],
        other: [showColorsViewOption]
      }
    },
    recruit.viewlet.ListCompanies
  )

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.class.Vacancy,
      descriptor: view.viewlet.List,
      config: [
        { key: '', displayProps: { fixed: 'left', key: 'app' } },
        {
          key: '@applications',
          label: recruit.string.Applications
        },
        'description',
        'comments',
        { key: '', displayProps: { grow: true } },
        {
          key: '$lookup.company',
          displayProps: { key: '$lookup.company', fixed: 'right' }
        },
        {
          key: 'location',
          displayProps: { key: 'location', fixed: 'right' }
        }
      ],
      configOptions: {
        strict: true,
        hiddenKeys: ['name', 'space', 'modifiedOn']
      },
      viewOptions: {
        groupBy: ['company', 'dueTo', 'createdBy'],
        orderBy: [
          ['company', SortingOrder.Ascending],
          ['dueTo', SortingOrder.Ascending],
          ['modifiedOn', SortingOrder.Descending],
          ['createdOn', SortingOrder.Descending]
        ],
        other: [vacancyHideArchivedOption],
        storageKey: 'vacancyViewOptions'
      }
    },
    recruit.viewlet.ListVacancy
  )

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.class.Applicant,
      descriptor: task.viewlet.Kanban,
      viewOptions: {
        ...applicantViewOptions(false, true),
        groupDepth: 1
      },
      options: {
        lookup: applicantKanbanLookup
      },
      configOptions: {
        strict: true
      },
      config: [
        '',
        'space',
        'assignee',
        'status',
        'attachments',
        'dueDate',
        'comments',
        {
          key: 'company',
          label: recruit.string.Company
        },
        {
          key: 'channels',
          label: contact.string.ContactInfo
        }
      ]
    },
    recruit.viewlet.ApplicantKanban
  )

  builder.createDoc(
    view.class.Viewlet,
    core.space.Model,
    {
      attachTo: recruit.class.Applicant,
      descriptor: task.viewlet.Dashboard,
      options: {},
      config: []
    },
    recruit.viewlet.ApplicantDashboard
  )

  builder.mixin(recruit.class.Applicant, core.class.Class, task.mixin.KanbanCard, {
    card: recruit.component.KanbanCard
  })

  // builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.PreviewPresenter, {
  //   presenter: recruit.component.KanbanCard
  // })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.ObjectEditor, {
    editor: recruit.component.EditApplication
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.ObjectEditor, {
    editor: recruit.component.EditVacancy
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.ObjectPresenter, {
    presenter: recruit.component.ApplicationPresenter
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.CollectionPresenter, {
    presenter: recruit.component.ApplicationsPresenter
  })

  builder.mixin(recruit.class.ApplicantMatch, core.class.Class, view.mixin.ObjectPresenter, {
    presenter: recruit.component.ApplicationMatchPresenter
  })

  builder.mixin(recruit.class.ApplicantMatch, core.class.Class, view.mixin.CollectionPresenter, {
    presenter: recruit.component.ApplicationMatchPresenter
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.ObjectPresenter, {
    presenter: recruit.component.VacancyPresenter
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.ObjectValidator, {
    validator: recruit.validator.ApplicantValidator
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.ObjectTitle, {
    titleProvider: recruit.function.AppTitleProvider
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.ObjectIdentifier, {
    provider: recruit.function.AppIdentifierProvider
  })

  builder.mixin(recruit.class.Review, core.class.Class, view.mixin.ObjectTitle, {
    titleProvider: recruit.function.RevTitleProvider
  })

  builder.mixin(recruit.class.Review, core.class.Class, view.mixin.ObjectIdentifier, {
    provider: recruit.function.ReviewIdentifierProvider
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.ObjectTitle, {
    titleProvider: recruit.function.VacTitleProvider
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.ObjectIdentifier, {
    provider: recruit.function.VacancyIdentifierProvider
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.LinkProvider, {
    encode: recruit.function.GetObjectLinkFragment
  })

  builder.mixin(recruit.class.Opinion, core.class.Class, view.mixin.LinkProvider, {
    encode: recruit.function.GetObjectLinkFragment
  })

  builder.mixin(recruit.class.Review, core.class.Class, view.mixin.LinkProvider, {
    encode: recruit.function.GetObjectLinkFragment
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.LinkProvider, {
    encode: recruit.function.GetObjectLinkFragment
  })

  builder.mixin(recruit.mixin.Candidate, core.class.Class, view.mixin.LinkProvider, {
    encode: recruit.function.GetIdObjectLinkFragment
  })

  builder.mixin(recruit.mixin.VacancyList, core.class.Class, view.mixin.LinkProvider, {
    encode: recruit.function.GetIdObjectLinkFragment
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.LinkIdProvider, {
    encode: recruit.function.IdProvider,
    decode: recruit.function.ParseLinkId
  })

  builder.mixin(recruit.class.Opinion, core.class.Class, view.mixin.LinkIdProvider, {
    encode: recruit.function.IdProvider,
    decode: recruit.function.ParseLinkId
  })

  builder.mixin(recruit.class.Review, core.class.Class, view.mixin.LinkIdProvider, {
    encode: recruit.function.IdProvider,
    decode: recruit.function.ParseLinkId
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.LinkIdProvider, {
    encode: recruit.function.IdProvider,
    decode: recruit.function.ParseLinkId
  })

  builder.createDoc(
    view.class.ActionCategory,
    core.space.Model,
    { label: recruit.string.RecruitApplication, visible: true },
    recruit.category.Recruit
  )

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.IgnoreActions, {
    actions: [view.action.Delete]
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.ObjectPanel, {
    component: recruit.component.EditVacancy
  })

  builder.mixin(recruit.mixin.Candidate, core.class.Class, view.mixin.ClassFilters, {
    filters: ['_class']
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.ClassFilters, {
    filters: ['attachedTo']
  })

  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.ClassFilters, {
    filters: []
  })

  builder.mixin(recruit.mixin.VacancyList, core.class.Class, view.mixin.ClassFilters, {
    filters: []
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.AttributeFilter, {
    component: recruit.component.ApplicantFilter
  })

  builder.mixin(recruit.class.Applicant, core.class.Class, notification.mixin.NotificationObjectPresenter, {
    presenter: recruit.component.NotificationApplicantPresenter
  })

  builder.createDoc(
    notification.class.NotificationGroup,
    core.space.Model,
    {
      label: recruit.string.Application,
      icon: recruit.icon.Application,
      objectClass: recruit.class.Applicant
    },
    recruit.ids.ApplicationNotificationGroup
  )

  builder.createDoc(
    notification.class.NotificationType,
    core.space.Model,
    {
      hidden: false,
      generated: false,
      label: task.string.AssignedToMe,
      group: recruit.ids.ApplicationNotificationGroup,
      field: 'assignee',
      txClasses: [core.class.TxCreateDoc, core.class.TxUpdateDoc],
      objectClass: recruit.class.Applicant,
      templates: {
        textTemplate: '{doc} was assigned to you by {sender}',
        htmlTemplate: '<p>{doc} was assigned to you by {sender}</p>',
        subjectTemplate: '{doc} was assigned to you'
      },
      defaultEnabled: true
    },
    recruit.ids.AssigneeNotification
  )

  generateClassNotificationTypes(
    builder,
    recruit.class.Applicant,
    recruit.ids.ApplicationNotificationGroup,
    [],
    ['comments', 'status', 'dueDate']
  )

  builder.createDoc(
    notification.class.NotificationGroup,
    core.space.Model,
    {
      label: recruit.string.Vacancy,
      icon: recruit.icon.Vacancy,
      objectClass: recruit.class.Vacancy
    },
    recruit.ids.VacancyNotificationGroup
  )

  builder.createDoc(
    notification.class.NotificationType,
    core.space.Model,
    {
      hidden: false,
      generated: false,
      label: recruit.string.CreateApplication,
      group: recruit.ids.VacancyNotificationGroup,
      field: 'space',
      txClasses: [core.class.TxCreateDoc, core.class.TxUpdateDoc],
      objectClass: recruit.class.Applicant,
      spaceSubscribe: true,
      defaultEnabled: false,
      templates: {
        textTemplate: '{body}',
        htmlTemplate: '<p>{body}</p><p>{link}</p>',
        subjectTemplate: '{title}'
      }
    },
    recruit.ids.ApplicationCreateNotification
  )

  generateClassNotificationTypes(builder, recruit.class.Vacancy, recruit.ids.VacancyNotificationGroup, [], ['comments'])

  builder.createDoc(
    notification.class.NotificationGroup,
    core.space.Model,
    {
      label: recruit.string.Talent,
      icon: recruit.icon.CreateCandidate,
      objectClass: recruit.mixin.Candidate
    },
    recruit.ids.CandidateNotificationGroup
  )

  generateClassNotificationTypes(
    builder,
    recruit.mixin.Candidate,
    recruit.ids.CandidateNotificationGroup,
    ['vacancyMatch'],
    ['comments']
  )

  builder.createDoc(
    view.class.FilterMode,
    core.space.Model,
    {
      label: recruit.string.HasActiveApplicant,
      result: recruit.function.HasActiveApplicant,
      disableValueSelector: true
    },
    recruit.filter.HasActive
  )

  builder.createDoc(
    view.class.FilterMode,
    core.space.Model,
    {
      label: recruit.string.HasNoActiveApplicant,
      result: recruit.function.HasNoActiveApplicant,
      disableValueSelector: true
    },
    recruit.filter.NoActive
  )
  builder.createDoc(
    view.class.FilterMode,
    core.space.Model,
    {
      label: recruit.string.NoneApplications,
      result: recruit.function.NoneApplications,
      disableValueSelector: true
    },
    recruit.filter.None
  )

  builder.createDoc(
    chunter.class.ChatMessageViewlet,
    core.space.Model,
    {
      messageClass: chunter.class.ChatMessage,
      objectClass: recruit.class.Vacancy,
      label: chunter.string.LeftComment
    },
    recruit.ids.VacancyChatMessageViewlet
  )

  builder.createDoc(
    chunter.class.ChatMessageViewlet,
    core.space.Model,
    {
      messageClass: chunter.class.ChatMessage,
      objectClass: recruit.class.Applicant,
      label: chunter.string.LeftComment
    },
    recruit.ids.ApplicantChatMessageViewlet
  )

  builder.createDoc(
    chunter.class.ChatMessageViewlet,
    core.space.Model,
    {
      messageClass: chunter.class.ChatMessage,
      objectClass: recruit.class.Review,
      label: chunter.string.LeftComment
    },
    recruit.ids.ReviewChatMessageViewlet
  )

  // Allow to use fuzzy search for mixins
  builder.createDoc(core.class.FullTextSearchContext, core.space.Model, {
    toClass: recruit.class.Vacancy,
    fullTextSummary: true
  })

  builder.createDoc(core.class.FullTextSearchContext, core.space.Model, {
    toClass: recruit.mixin.Candidate,
    fullTextSummary: true
  })

  // Allow to use fuzzy search for mixins
  builder.createDoc(core.class.FullTextSearchContext, core.space.Model, {
    toClass: recruit.class.Applicant,
    fullTextSummary: true,
    forceIndex: true
  })

  builder.mixin(recruit.mixin.Candidate, core.class.Class, view.mixin.ObjectEditorFooter, {
    editor: tracker.component.RelatedIssuesSection,
    props: {
      label: tracker.string.RelatedIssues
    }
  })
  builder.mixin(recruit.class.Vacancy, core.class.Class, view.mixin.ObjectEditorFooter, {
    editor: tracker.component.RelatedIssuesSection,
    props: {
      label: tracker.string.RelatedIssues
    }
  })
  builder.mixin(recruit.class.Applicant, core.class.Class, view.mixin.ObjectEditorFooter, {
    editor: tracker.component.RelatedIssuesSection,
    props: {
      label: tracker.string.RelatedIssues
    }
  })

  builder.createDoc(
    activity.class.DocUpdateMessageViewlet,
    core.space.Model,
    {
      objectClass: recruit.class.Applicant,
      action: 'update',
      config: {
        status: {
          iconPresenter: task.component.StateIconPresenter
        }
      }
    },
    recruit.ids.ApplicantUpdatedActivityViewlet
  )

  defineSpaceType(builder)
  definePermissions(builder)
}
