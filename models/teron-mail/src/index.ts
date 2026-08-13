//
// Copyright © 2025 Hardcore Engineering Inc.
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

import { teronMailIntegrationKind } from '@hcengineering/teron-mail'
import { type Builder } from '@hcengineering/model'
import core from '@hcengineering/model-core'
import setting from '@hcengineering/setting'

import teronMail from './plugin'

export { teronMailId } from '@hcengineering/teron-mail'
export { default } from './plugin'

export function createModel (builder: Builder): void {
  builder.createDoc(
    setting.class.IntegrationType,
    core.space.Model,
    {
      label: teronMail.string.IntegrationLabel,
      description: teronMail.string.IntegrationDescription,
      icon: teronMail.component.IconTeronMail,
      allowMultiple: true,
      createComponent: teronMail.component.Connect,
      onDisconnect: teronMail.handler.DisconnectHandler,
      onDisconnectAll: teronMail.handler.DisconnectAllHandler,
      reconnectComponent: teronMail.component.Connect,
      configureComponent: teronMail.component.Configure,
      stateComponent: teronMail.component.IntegrationState,
      kind: teronMailIntegrationKind
    },
    teronMail.integrationType.TeronMail
  )
}
