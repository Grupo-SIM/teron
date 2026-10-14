jest.mock('@hcengineering/ui', () => ({ anonymousMode: { enabled: false } }))
jest.mock('svelte/store', () => ({ get: (store: { enabled: boolean }) => store.enabled }))
jest.mock('@hcengineering/platform', () => ({ getMetadata: () => 'workspace' }))
jest.mock('@hcengineering/presentation', () => ({
  __esModule: true,
  default: { metadata: { WorkspaceUuid: 'workspace' } },
  createPulseClient: jest.fn()
}))

import { anonymousMode } from '@hcengineering/ui'
import { createPulseClient } from '@hcengineering/presentation'
import { updatePresence } from './presence'
import { setTyping } from './typing'

const pulse = { put: jest.fn(), delete: jest.fn() }
const preference = anonymousMode as unknown as { enabled: boolean }

beforeEach(() => {
  jest.clearAllMocks()
  preference.enabled = false
  ;(createPulseClient as jest.Mock).mockResolvedValue(pulse)
})

test('anonymous mode removes document presence instead of publishing it', async () => {
  preference.enabled = true
  await updatePresence({ personId: 'person' as any, objectId: 'doc', objectClass: 'class' as any }, 5)
  expect(pulse.put).not.toHaveBeenCalled()
  expect(pulse.delete).toHaveBeenCalledWith('workspace/presence/doc/person')
})

test('anonymous mode clears typing instead of publishing it', async () => {
  preference.enabled = true
  await setTyping('person' as any, 'doc')
  expect(pulse.put).not.toHaveBeenCalled()
  expect(pulse.delete).toHaveBeenCalledWith('workspace/typing/doc/person')
})

test('normal mode publishes presence and typing', async () => {
  await updatePresence({ personId: 'person' as any, objectId: 'doc', objectClass: 'class' as any }, 5)
  await setTyping('person' as any, 'doc')
  expect(pulse.put).toHaveBeenCalledTimes(2)
  expect(pulse.delete).not.toHaveBeenCalled()
})
