// Retry stale chunks, but never turn a persistent module error into a reload loop.
export async function loadPlugin<T> (loader: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await loader()
    } catch (error: unknown) {
      const chunkFailure = error instanceof Error &&
        (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk'))
      if (!chunkFailure) {
        throw error
      }
      if (attempt < 4) {
        continue
      }

      // sessionStorage survives reloads. If storage is blocked, preserve the
      // error instead of attempting a reload we cannot keep track of.
      let reload = false
      try {
        const key = `pluginChunkReload:${error.message}`
        if (sessionStorage.getItem(key) === null) {
          sessionStorage.setItem(key, 'true')
          reload = true
        }
      } catch {}
      if (reload) {
        console.log('reload due to chunk loading error', error)
        location.reload()
      }
      throw error
    }
  }
  throw new Error('Plugin loading attempts exhausted')
}
