import { shouldRestoreMeetingPresence } from './meeting-presence-recovery'

const previous = { _id: 'original', room: 'meeting', sessionId: 'session' }
const recreated = { _id: 'new', room: 'reception', sessionId: null }

describe('meeting presence recovery', () => {
  test('restores recreated default presence belonging to this active call session', () => {
    expect(shouldRestoreMeetingPresence(previous, recreated, 'meeting', 'session', 'reception', true)).toBe(true)
    expect(shouldRestoreMeetingPresence(previous, { ...recreated, room: 'office' }, 'meeting', 'session', 'office', true)).toBe(true)
  })
  test('preserves explicit kicks and moves of original participant', () => {
    expect(shouldRestoreMeetingPresence(previous, { ...recreated, _id: previous._id }, 'meeting', 'session', 'reception', true)).toBe(false)
    expect(shouldRestoreMeetingPresence(previous, { ...recreated, room: 'other' }, 'meeting', 'session', 'reception', true)).toBe(false)
  })
  test('does not reclaim presence owned by another tab', () => {
    expect(shouldRestoreMeetingPresence(previous, recreated, 'meeting', 'other-session', 'reception', true)).toBe(false)
    expect(shouldRestoreMeetingPresence(previous, { ...recreated, sessionId: 'other' }, 'meeting', 'session', 'reception', true)).toBe(false)
  })
  test('stops after explicit leave or room deletion', () => {
    expect(shouldRestoreMeetingPresence(previous, recreated, undefined, 'session', 'reception', true)).toBe(false)
    expect(shouldRestoreMeetingPresence(previous, recreated, 'meeting', 'session', 'reception', false)).toBe(false)
  })
  test('requires previous participation and settled replacement', () => {
    expect(shouldRestoreMeetingPresence(undefined, recreated, 'meeting', 'session', 'reception', true)).toBe(false)
    expect(shouldRestoreMeetingPresence(previous, undefined, 'meeting', 'session', 'reception', true)).toBe(false)
    expect(shouldRestoreMeetingPresence(previous, recreated, 'meeting', null, 'reception', true)).toBe(false)
  })
})
