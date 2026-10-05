//
// Copyright © 2024-2025 Hardcore Engineering Inc.
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

import { Model, UX, type Builder } from '@hcengineering/model'
import core, { TDoc } from '@hcengineering/model-core'
import { type IntlString } from '@hcengineering/platform'
import setting from '@hcengineering/setting'
import billing, { TIER_LIMITS_GB, type Tier } from '@hcengineering/billing'
import { AccountRole, DOMAIN_MODEL } from '@hcengineering/core'
import presentation from '@hcengineering/model-presentation'
import workbench from '@hcengineering/workbench'

export { billingId } from '@hcengineering/billing'
export { billing as default }

@Model(billing.class.Tier, core.class.Doc, DOMAIN_MODEL)
@UX(billing.string.Tier)
export class TTier extends TDoc implements Tier {
  label!: IntlString
  description!: IntlString
  storageLimitGB!: number
  trafficLimitGB!: number

  priceMonthly!: number
  index!: number
  color?: string
}

export function createModel (builder: Builder): void {
  builder.createModel(TTier)

  builder.createDoc(setting.class.WorkspaceSettingCategory, core.space.Model, {
    name: 'billing',
    label: billing.string.Billing,
    icon: billing.icon.Billing,
    component: billing.component.Settings,
    group: 'settings-editor',
    role: AccountRole.Owner,
    order: 920
  })

  builder.createDoc(
    billing.class.Tier,
    core.space.Model,
    {
      label: billing.string.Free,
      description: billing.string.FreeDescription,
      storageLimitGB: TIER_LIMITS_GB.common.storageGB,
      trafficLimitGB: TIER_LIMITS_GB.common.trafficGB,
      priceMonthly: 0,
      index: 0
    },
    billing.tier.Free
  )

  builder.createDoc(
    billing.class.Tier,
    core.space.Model,
    {
      label: billing.string.Business,
      description: billing.string.BusinessDescription,
      storageLimitGB: TIER_LIMITS_GB.legendary.storageGB,
      trafficLimitGB: TIER_LIMITS_GB.legendary.trafficGB,
      priceMonthly: 0,
      index: 1,
      color: 'Sky'
    },
    billing.tier.Business
  )

  builder.createDoc(
    billing.class.Tier,
    core.space.Model,
    {
      label: billing.string.Unlimited,
      description: billing.string.UnlimitedDescription,
      storageLimitGB: 0,
      trafficLimitGB: 1_000_000_000,
      priceMonthly: 0,
      index: 2,
      color: 'Grass'
    },
    billing.tier.Unlimited
  )

  builder.createDoc(presentation.class.ComponentPointExtension, core.space.Model, {
    extension: workbench.extensions.WorkbenchExtensions,
    component: billing.component.WorkbenchExtension
  })
}
