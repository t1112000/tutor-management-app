import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { createStore, del, get, set } from 'idb-keyval'

export const QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000
export const QUERY_CACHE_BUSTER = 'v3'

const QUERY_CACHE_KEY = 'react-query-cache'
const queryCacheStore = createStore('myclass-query-cache', 'query-cache')

export const queryCachePersister: Persister = {
  persistClient: async (persistedClient: PersistedClient) => {
    await set(QUERY_CACHE_KEY, persistedClient, queryCacheStore)
  },
  restoreClient: async () => {
    const persistedClient = await get<PersistedClient>(QUERY_CACHE_KEY, queryCacheStore)
    return persistedClient ?? undefined
  },
  removeClient: async () => {
    await del(QUERY_CACHE_KEY, queryCacheStore)
  },
}
