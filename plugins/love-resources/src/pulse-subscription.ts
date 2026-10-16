import { type Callback, type UnsubscribeCallback } from '@hcengineering/hulypulse-client'
import { createPulseClient } from '@hcengineering/presentation'

/** Owns retries and discards late subscriptions after a room change or unmount. */
export class PulseSubscription {
  private generation = 0
  private timer: ReturnType<typeof setTimeout> | undefined
  private unsubscribe: UnsubscribeCallback | undefined

  async start<T> (key: string, callback: Callback<T>): Promise<void> {
    const stopped = this.stop()
    const generation = this.generation
    await stopped
    if (generation !== this.generation) return
    const knownKeys = new Set<string>()
    const guardedCallback: Callback<T> = (key, value) => {
      if (generation !== this.generation) return
      if (value === undefined) knownKeys.delete(key)
      else knownKeys.add(key)
      callback(key, value)
    }
    const attempt = async (): Promise<void> => {
      try {
        const client = await createPulseClient()
        if (generation !== this.generation) return
        if (client === undefined) throw new Error('Pulse is unavailable')
        const unsubscribe = await client.subscribe(key, guardedCallback)
        if (generation !== this.generation) {
          await unsubscribe()
          return
        }
        this.unsubscribe = unsubscribe
        const refresh = async (): Promise<void> => {
          if (generation !== this.generation) return
          try {
            const snapshot = new Map<string, T | undefined>()
            await client.refresh<T>(key, (key, value) => { snapshot.set(key, value) })
            if (generation !== this.generation) return
            for (const oldKey of knownKeys) {
              if (!snapshot.has(oldKey)) guardedCallback(oldKey, undefined)
            }
            for (const [key, value] of snapshot) guardedCallback(key, value)
          } catch (error) {
            console.warn('Room notification refresh failed; retrying', error)
          }
          if (generation === this.generation) this.timer = setTimeout(() => { void refresh() }, 500)
        }
        this.timer = setTimeout(() => { void refresh() }, 500)
      } catch (error) {
        if (generation !== this.generation) return
        console.warn('Room notification subscription failed; retrying', error)
        this.timer = setTimeout(() => { void attempt() }, 1000)
      }
    }
    await attempt()
  }

  async stop (): Promise<void> {
    this.generation++
    clearTimeout(this.timer)
    this.timer = undefined
    const unsubscribe = this.unsubscribe
    this.unsubscribe = undefined
    if (unsubscribe !== undefined) {
      try {
        await unsubscribe()
      } catch (error) {
        console.warn('Room notification unsubscribe failed', error)
      }
    }
  }
}
