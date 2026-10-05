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

import { type IntlString, mergeIds } from '@hcengineering/platform'

import bitrix, { bitrixId } from '@hcengineering/bitrix'
import { type Ref } from '@hcengineering/core'
import { type Handler, type IntegrationType } from '@hcengineering/setting'
import { type AnyComponent } from '@hcengineering/ui/src/types'

export default mergeIds(bitrixId, bitrix, {
  string: {
    Activity: '' as IntlString,
    Ascending: '' as IntlString,
    AddChannelMapping: '' as IntlString,
    AddCopyMapping: '' as IntlString,
    AddDownloadAttachmentMapping: '' as IntlString,
    AddFieldReferenceMapping: '' as IntlString,
    AddMixin: '' as IntlString,
    AddTagMapping: '' as IntlString,
    Attachments: '' as IntlString,
    BitrixFieldLookup: '' as IntlString,
    BitrixSynchronization: '' as IntlString,
    BitrixTokenUrl: '' as IntlString,
    Bitrix: '' as IntlString,
    BitrixDesc: '' as IntlString,
    Settings: '' as IntlString,
    EntityMapping: '' as IntlString,
    NotAllowed: '' as IntlString,
    AddMapping: '' as IntlString,
    BitrixEntityType: '' as IntlString,
    FieldMapping: '' as IntlString,
    AddField: '' as IntlString,
    Attribute: '' as IntlString,
    MapField: '' as IntlString,
    Channel: '' as IntlString,
    ClassSettings: '' as IntlString,
    Close: '' as IntlString,
    Comments: '' as IntlString,
    Company: '' as IntlString,
    Contacts: '' as IntlString,
    CopyField: '' as IntlString,
    CopyFollowingFields: '' as IntlString,
    CreateVacancyAndApplication: '' as IntlString,
    Descending: '' as IntlString,
    Direction: '' as IntlString,
    Download: '' as IntlString,
    Expert: '' as IntlString,
    FieldToFill: '' as IntlString,
    FinalState: '' as IntlString,
    Initial: '' as IntlString,
    Limit: '' as IntlString,
    Leads: '' as IntlString,
    LoadFirstValues: '' as IntlString,
    LoadLastValues: '' as IntlString,
    Mappings: '' as IntlString,
    Meaningful: '' as IntlString,
    MixinsToInclude: '' as IntlString,
    ModifyExisting: '' as IntlString,
    New: '' as IntlString,
    None: '' as IntlString,
    NoIntegrationConfigured: '' as IntlString,
    Options: '' as IntlString,
    Period: '' as IntlString,
    Replace: '' as IntlString,
    Separator: '' as IntlString,
    ShouldExclude: '' as IntlString,
    ShouldInclude: '' as IntlString,
    SourceState: '' as IntlString,
    State: '' as IntlString,
    StateField: '' as IntlString,
    StateMapping: '' as IntlString,
    Synchronize: '' as IntlString,
    SyncAttachments: '' as IntlString,
    SyncComments: '' as IntlString,
    SyncEmail: '' as IntlString,
    Template: '' as IntlString,
    Vacancy: '' as IntlString,
    VacancyField: '' as IntlString
  },
  component: {
    BitrixIcon: '' as AnyComponent
  },
  handler: {
    DisconnectHandler: '' as Handler
  },
  integrationType: {
    Bitrix: '' as Ref<IntegrationType>
  }
})
