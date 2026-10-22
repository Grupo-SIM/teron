import { createDebouncedSearch } from './debounced-search'

function deferred<T> (): { promise: Promise<T>, resolve: (value: T) => void, reject: (error: Error) => void } {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => { jest.useFakeTimers() })
afterEach(() => { jest.useRealTimers() })

function setup () {
  const requests = new Map<string, ReturnType<typeof deferred<string>>>()
  const search = jest.fn((input: string) => {
    const request = deferred<string>()
    requests.set(input, request)
    return request.promise
  })
  const handlers = { pending: jest.fn(), result: jest.fn(), error: jest.fn() }
  return { requests, search, handlers, controller: createDebouncedSearch(search, handlers) }
}

test('rapid typing sends only the final query after 200 ms', () => {
  const { controller, search, handlers } = setup()
  controller.update('t')
  jest.advanceTimersByTime(100)
  controller.update('te')
  jest.advanceTimersByTime(100)
  controller.update('tech')
  jest.advanceTimersByTime(199)
  expect(search).not.toHaveBeenCalled()
  expect(handlers.pending).toHaveBeenCalledTimes(3)
  jest.advanceTimersByTime(1)
  expect(search).toHaveBeenCalledTimes(1)
  expect(search).toHaveBeenCalledWith('tech')
})

test('new query runs without waiting for old request and wins out-of-order completion', async () => {
  const { controller, requests, handlers, search } = setup()
  controller.update('old')
  jest.advanceTimersByTime(200)
  controller.update('tech')
  jest.advanceTimersByTime(200)
  expect(search).toHaveBeenCalledTimes(2)
  requests.get('tech')?.resolve('TECH-23')
  await Promise.resolve()
  requests.get('old')?.resolve('INFO-10')
  await Promise.resolve()
  expect(handlers.result.mock.calls).toEqual([['TECH-23']])
})

test('new input invalidates in-flight results even during debounce', async () => {
  const { controller, requests, handlers } = setup()
  controller.update('old')
  jest.advanceTimersByTime(200)
  controller.update('tech')
  requests.get('old')?.resolve('INFO-10')
  await Promise.resolve()
  expect(handlers.result).not.toHaveBeenCalled()
})

test('clearing or closing cancels queued and in-flight searches', async () => {
  const { controller, requests, search, handlers } = setup()
  controller.update('old')
  jest.advanceTimersByTime(200)
  controller.update('tech')
  controller.cancel()
  jest.advanceTimersByTime(200)
  requests.get('old')?.resolve('INFO-10')
  await Promise.resolve()
  expect(search).toHaveBeenCalledTimes(1)
  expect(handlers.result).not.toHaveBeenCalled()
})

test('current failures settle loading, obsolete failures are ignored, and retry works', async () => {
  const { controller, requests, handlers } = setup()
  controller.update('old')
  jest.advanceTimersByTime(200)
  controller.update('tech')
  jest.advanceTimersByTime(200)
  requests.get('old')?.reject(new Error('obsolete'))
  await Promise.resolve()
  expect(handlers.error).not.toHaveBeenCalled()
  const error = new Error('unavailable')
  requests.get('tech')?.reject(error)
  await Promise.resolve()
  expect(handlers.error).toHaveBeenCalledWith(error)
  controller.update('tech')
  jest.advanceTimersByTime(200)
  requests.get('tech')?.resolve('TECH-23')
  await Promise.resolve()
  expect(handlers.result).toHaveBeenCalledWith('TECH-23')
})
