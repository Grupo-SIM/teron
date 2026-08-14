type Subscriber<T> = (value: T) => void

export function writable<T> (initial?: T) {
  let value = initial as T
  const subscribers = new Set<Subscriber<T>>()

  return {
    subscribe (subscriber: Subscriber<T>) {
      subscribers.add(subscriber)
      subscriber(value)
      return () => subscribers.delete(subscriber)
    },
    set (next: T) {
      value = next
      subscribers.forEach((subscriber) => subscriber(value))
    },
    update (updater: (current: T) => T) {
      value = updater(value)
      subscribers.forEach((subscriber) => subscriber(value))
    }
  }
}

export function derived<T> () {
  return writable<T>()
}
