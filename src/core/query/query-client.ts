import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import { AppState, Platform } from 'react-native';

import { mapApiError, NetworkFailure, ServerUnavailableFailure } from '@/core/failures';

const MINUTE = 60_000;

/** Freshness per kind of data (spec §5.1). Use these when defining queries. */
export const cacheTimes = {
  categories: { staleTime: Infinity, gcTime: Infinity },
  events: { staleTime: 2 * MINUTE, gcTime: 10 * MINUTE },
  event: { staleTime: 10 * MINUTE, gcTime: 30 * MINUTE },
  me: { staleTime: 5 * MINUTE, gcTime: Infinity },
  savedEvents: { staleTime: MINUTE, gcTime: 7 * 24 * 60 * MINUTE },
} as const;

export const queryKeys = {
  categories: ['categories'] as const,
  events: (params: object) => ['events', params] as const,
  event: (id: string) => ['event', id] as const,
  me: ['me'] as const,
  savedEvents: ['saved-events'] as const,
};

/**
 * Retry twice only when trying again can help: no connection or a server-side problem. Everything else (rejected
 * input, not found, rate limited, signed out, cancelled) won't succeed on a retry. Accepts domain failures and,
 * until every feature has a repository, raw API errors.
 */
export function shouldRetry(failureCount: number, error: unknown) {
  const failure = mapApiError(error);
  const transient = failure instanceof NetworkFailure || failure instanceof ServerUnavailableFailure;
  return transient && failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry, staleTime: MINUTE },
    mutations: { retry: false },
  },
});

// Refetch when the app returns to the foreground…
AppState.addEventListener('change', (status) => {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
});
// …and pause/resume queries and mutations with the connection (offline mode, spec §5.2).
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
);

const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'momento.query-cache' });

/** Only My Events (and queued mutations) are kept for offline use (spec §5.2). */
export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister,
  maxAge: cacheTimes.savedEvents.gcTime,
  buster: 'v1', // bump when persisted data shapes change
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => query.queryKey[0] === 'saved-events' && query.state.status === 'success',
  },
};

/** Clears the cache and its saved copy on the device, so the next user never sees old data (called on sign-out). */
export async function clearQueryCache() {
  queryClient.clear();
  await persister.removeClient();
}
