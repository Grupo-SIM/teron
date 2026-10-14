import { writable } from 'svelte/store'

const storageKey = '#platform.anonymous-mode'

function readPreference (): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(storageKey) === 'true'
  } catch {
    return false
  }
}

export const anonymousMode = writable(readPreference())
anonymousMode.subscribe((enabled) => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey, String(enabled))
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
})

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) anonymousMode.set(readPreference())
  })
}
