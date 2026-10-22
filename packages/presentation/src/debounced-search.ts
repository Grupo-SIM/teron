/** Debounce input without letting slow, obsolete requests delay or replace newer results. */
export function createDebouncedSearch<TInput, TResult> (
  search: (input: TInput) => Promise<TResult>,
  handlers: {
    pending: () => void
    result: (result: TResult) => void
    error: (error: unknown) => void
  },
  delay: number = 200
): { update: (input: TInput) => void, cancel: () => void } {
  let revision = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  const cancel = (): void => {
    revision++
    clearTimeout(timer)
    timer = undefined
  }

  return {
    cancel,
    update: (input) => {
      cancel()
      const current = revision
      handlers.pending()
      timer = setTimeout(() => {
        timer = undefined
        void (async () => {
          try {
            const result = await search(input)
            if (current === revision) handlers.result(result)
          } catch (error) {
            if (current === revision) handlers.error(error)
          }
        })()
      }, delay)
    }
  }
}
