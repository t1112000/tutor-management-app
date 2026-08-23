'use client'

import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useState } from 'react'
import {
  QUERY_CACHE_MAX_AGE,
  QUERY_CACHE_BUSTER,
  queryCachePersister,
} from '@/lib/query-cache-persistence'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale-while-revalidate: the persisted cache paints instantly, then
            // every mount/focus/reconnect refreshes. With refetch-on-* disabled,
            // a second device (or a reload restoring the 24h cache) could show
            // stale billing data indefinitely.
            staleTime: 60 * 1000,
            // Must be >= the persisted maxAge, or restored entries are dropped
            // straight away and the persistence buys nothing.
            gcTime: 24 * 60 * 60 * 1000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
            retry: 1,
          },
        },
      }),
  )

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: queryCachePersister,
        buster: QUERY_CACHE_BUSTER,
        maxAge: QUERY_CACHE_MAX_AGE,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            if (query.state.status !== 'success') return false
            const [scope, kind, term] = query.queryKey
            // Don't persist plaintext credentials from order/account detail GETs.
            if (
              (scope === 'orders' || scope === 'accounts') &&
              typeof kind === 'number'
            ) {
              return false
            }
            // Don't persist every keystroke of the student search: each debounced
            // term becomes its own cache entry and is pure dead weight on disk.
            return !(scope === 'students' && kind === 'list' && !!term)
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
