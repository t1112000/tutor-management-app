import type { DehydratedState } from "@tanstack/react-query";

const DB_NAME = "myclass-query-cache";
const DB_VERSION = 1;
const STORE_NAME = "cache";
const CACHE_KEY = "react-query";

export const QUERY_CACHE_BUSTER = "v1";
export const QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

type PersistedQueryCache = {
  buster: string;
  timestamp: number;
  state: DehydratedState;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => T,
): Promise<T> {
  const db = await openDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    try {
      const result = handler(store);
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
      transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    } catch (error) {
      reject(error);
    }
  });
}

export async function readPersistedQueryCache(): Promise<PersistedQueryCache | null> {
  if (!isBrowser()) return null;

  try {
    const db = await openDb();
    return await new Promise<PersistedQueryCache | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(CACHE_KEY);

      request.onsuccess = () => resolve((request.result as PersistedQueryCache | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("Failed to read query cache"));
    });
  } catch {
    return null;
  }
}

export async function writePersistedQueryCache(state: DehydratedState): Promise<void> {
  if (!isBrowser()) return;

  try {
    await withStore("readwrite", (store) => {
      store.put(
        {
          buster: QUERY_CACHE_BUSTER,
          timestamp: Date.now(),
          state,
        } satisfies PersistedQueryCache,
        CACHE_KEY,
      );
    });
  } catch {
    // Ignore storage failures and fall back to in-memory cache only.
  }
}

export async function clearPersistedQueryCache(): Promise<void> {
  if (!isBrowser()) return;

  try {
    await withStore("readwrite", (store) => {
      store.delete(CACHE_KEY);
    });
  } catch {
    // Ignore clear failures.
  }
}
