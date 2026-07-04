'use client'

import { dehydrate, hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  clearPersistedQueryCache,
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_MAX_AGE,
  readPersistedQueryCache,
  writePersistedQueryCache,
} from '@/lib/query-cache-persistence'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            retry: 1,
          },
        },
      }),
  )

  useEffect(() => {
    let alive = true;

    void (async () => {
      const persisted = await readPersistedQueryCache();
      if (!alive || !persisted) return;

      const isFresh = Date.now() - persisted.timestamp < QUERY_CACHE_MAX_AGE;
      if (persisted.buster === QUERY_CACHE_BUSTER && isFresh) {
        hydrate(client, persisted.state);
      } else {
        await clearPersistedQueryCache();
      }
    })();

    return () => {
      alive = false;
    };
  }, [client]);

  useEffect(() => {
    let persistTimer: number | undefined;

    const persistNow = () => {
      void writePersistedQueryCache(dehydrate(client));
    };

    const schedulePersist = () => {
      if (persistTimer) window.clearTimeout(persistTimer);
      persistTimer = window.setTimeout(persistNow, 250);
    };

    schedulePersist();
    const unsubscribe = client.getQueryCache().subscribe(schedulePersist);

    const handlePageHide = () => {
      persistNow();
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      if (persistTimer) window.clearTimeout(persistTimer);
      unsubscribe();
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
