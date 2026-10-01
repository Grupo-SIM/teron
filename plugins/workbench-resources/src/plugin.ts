//
// Copyright © 2020 Anticrm Platform Contributors.
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

import { mergeIds } from '@hcengineering/platform'
import type { IntlString } from '@hcengineering/platform'

import workbench, { workbenchId } from '@hcengineering/workbench'
import { type AnyComponent } from '@hcengineering/ui/src/types'

export default mergeIds(workbenchId, workbench, {
  string: {
    Benchmark: '' as IntlString,
    ClearWarning: '' as IntlString,
    ForceClose: '' as IntlString,
    More: '' as IntlString,
    Delete: '' as IntlString,
    ShowMenu: '' as IntlString,
    HideMenu: '' as IntlString,
    Archived: '' as IntlString,
    Open: '' as IntlString,
    General: '' as IntlString,
    Members: '' as IntlString,
    BrowseSpaces: '' as IntlString,
    AccountDisabled: '' as IntlString,
    AccountDisabledDescr: '' as IntlString,
    HelpAndSupport: '' as IntlString,
    HelpCenter: '' as IntlString,
    KeyboardShortcuts: '' as IntlString,
    Documentation: '' as IntlString,
    OpenPlatformGuide: '' as IntlString,
    AccessWorkspaceSettings: '' as IntlString,
    HowToWorkFaster: '' as IntlString,
    OpenInNewTab: '' as IntlString,
    NewVersionAvailable: '' as IntlString,
    PleaseUpdate: '' as IntlString,
    WorkspaceCreating: '' as IntlString,
    AccessDenied: '' as IntlString,
    Widget: '' as IntlString,
    WidgetPreference: '' as IntlString,
    Tab: '' as IntlString,
    ActiveConnections: '' as IntlString,
    Average: '' as IntlString,
    CommandBenchmark: '' as IntlString,
    ConnectionsCount: '' as IntlString,
    ConnectionStatistics: '' as IntlString,
    CurrentFiveMinutesTransactions: '' as IntlString,
    DataSize: '' as IntlString,
    MaintenanceMessage: '' as IntlString,
    MinutesShort: '' as IntlString,
    Operations: '' as IntlString,
    Parallel: '' as IntlString,
    PreviousFiveMinutesTransactions: '' as IntlString,
    ResponseSize: '' as IntlString,
    ServiceName: '' as IntlString,
    ShowActiveFiveMinutes: '' as IntlString,
    ShowOnlyUsers: '' as IntlString,
    Total: '' as IntlString,
    TotalTransactions: '' as IntlString,
    UniqueUsers: '' as IntlString,
    UsersCount: '' as IntlString,
    WorkspaceConnectionSummary: '' as IntlString,
    WorkspacesCount: '' as IntlString,
    ProfileServer: '' as IntlString,
    RebootWorkspace: '' as IntlString,
    ServerManager: '' as IntlString,
    Servers: '' as IntlString,
    SetMaintenanceWarning: '' as IntlString,
    StopProfiling: '' as IntlString,
    Users: '' as IntlString,
    WipeStatistics: '' as IntlString
  },
  component: {
    SpacePanel: '' as AnyComponent,
    Workbench: '' as AnyComponent
  }
})
