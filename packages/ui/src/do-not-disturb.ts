import { writable } from 'svelte/store'

const storageKey = '#platform.do-not-disturb'
export const doNotDisturbCache = 'teron-notification-preferences'
export const doNotDisturbPath = '/__teron-do-not-disturb'

function readPreference (): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(storageKey) === 'true'
  } catch {
    return false
  }
}

export const doNotDisturb = writable(readPreference())

// Cache Storage shares the local preference with push workers, even with no open tabs.
let cacheWrite = Promise.resolve()
doNotDisturb.subscribe((enabled) => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey, String(enabled))
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
  if (typeof window !== 'undefined' && 'caches' in window) {
    cacheWrite = cacheWrite.then(async () => {
      const cache = await caches.open(doNotDisturbCache)
      await cache.put(doNotDisturbPath, new Response(String(enabled)))
    }).catch(() => {})
  }
})

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) doNotDisturb.set(readPreference())
  })
}
