import { navigate } from './location'

jest.mock('@hcengineering/analytics', () => ({ Analytics: { navigate: jest.fn() } }))
jest.mock('@hcengineering/core', () => ({ clone: (value: unknown) => JSON.parse(JSON.stringify(value)) }))
jest.mock('./popups', () => ({ closePopup: jest.fn() }))
jest.mock('svelte/store', () => ({
  derived: jest.fn(),
  get: jest.fn(),
  writable: jest.fn(() => ({ set: jest.fn() }))
}))

import { Analytics } from '@hcengineering/analytics'
import { writable } from 'svelte/store'

const locationStore = (writable as jest.Mock).mock.results[0].value

describe('panel navigation', () => {
  const path = ['workbench', 'workspace', 'love']
  const fragment = encodeURIComponent('view:component:EditDoc|room-id|love:class:Room|content')
  let pushState: jest.SpyInstance
  let replaceState: jest.SpyInstance

  beforeEach(() => {
    history.replaceState(null, '', '/workbench/workspace/love')
    localStorage.clear()
    jest.clearAllMocks()
    pushState = jest.spyOn(history, 'pushState')
    replaceState = jest.spyOn(history, 'replaceState')
  })

  afterEach(() => {
    pushState.mockRestore()
    replaceState.mockRestore()
  })

  it('publishes an encoded panel link once, even when requested repeatedly', () => {
    expect(navigate({ path, fragment })).toBe(true)
    for (let index = 0; index < 100; index++) {
      expect(navigate({ path, fragment })).toBe(false)
    }
    expect(pushState).toHaveBeenCalledTimes(1)
    expect(Analytics.navigate).toHaveBeenCalledTimes(1)
    expect(locationStore.set).toHaveBeenCalledTimes(1)
  })

  it('does not replace history for a restored encoded panel already open in the browser', () => {
    history.replaceState(null, '', `/workbench/workspace/love#${fragment}`)
    replaceState.mockClear()
    expect(navigate({ path, fragment }, true)).toBe(false)
    expect(replaceState).not.toHaveBeenCalled()
    expect(Analytics.navigate).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })

  it('still navigates to another document and closes its panel', () => {
    expect(navigate({ path, fragment })).toBe(true)
    expect(navigate({ path, fragment: fragment.replace('room-id', 'another-room') })).toBe(true)
    expect(navigate({ path })).toBe(true)
    expect(navigate({ path, fragment: '' })).toBe(false)
    expect(pushState).toHaveBeenCalledTimes(3)
  })

  it('still navigates to another screen with the same panel', () => {
    expect(navigate({ path, fragment })).toBe(true)
    expect(navigate({ path: [...path, 'another-screen'], fragment })).toBe(true)
    expect(pushState).toHaveBeenCalledTimes(2)
  })
})
