import { BitrixEntityType, mappingTypes } from '@hcengineering/bitrix'

import bitrix from './plugin'

const labels = {
  [BitrixEntityType.Company]: bitrix.string.Company,
  [BitrixEntityType.Contact]: bitrix.string.Contacts,
  [BitrixEntityType.Lead]: bitrix.string.Leads
}

export const localizedMappingTypes = mappingTypes.map(({ id }) => ({ id, label: labels[id] }))
