// Svelte's ESM store package cannot load under this package's CommonJS Jest setup.
// Keep subscriptions synchronous, matching the writable/derived contracts used here.
export function writable (initial: any): any {
  let value = initial
  const subscribers = new Set<(value: any) => void>()
  return {
    subscribe (subscriber: (value: any) => void) {
      subscribers.add(subscriber)
      subscriber(value)
      return () => subscribers.delete(subscriber)
    },
    set (next: any) {
      value = next
      subscribers.forEach((subscriber) => subscriber(value))
    }
  }
}

export function get (store: any): any {
  let value: any
  store.subscribe((next: any) => { value = next })()
  return value
}

export function derived (stores: any[], project: (values: any[]) => any): any {
  const values = stores.map(get)
  const result = writable(project(values))
  stores.forEach((store, index) => {
    store.subscribe((value: any) => {
      values[index] = value
      result.set(project(values))
    })
  })
  return result
}
