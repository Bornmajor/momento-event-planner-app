import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { eventsApi, type CategoryId, type EventPage, type EventSearchParams, type EventSummary } from '@/api/endpoints';
import { findSavedEvent } from '@/features/saved-events/mutations';
import { cacheTimes, queryClient, queryKeys } from '@/core/query/query-client';

import { nextPageParam, PAGE_SIZE } from './format';

/** The fixed category list (cached for the app's lifetime). */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async ({ signal }) => (await eventsApi.categories(signal)).items,
    ...cacheTimes.categories,
  });
}

export type EventWhen = NonNullable<EventSearchParams['when']>;

/**
 * Infinite event search, soonest first. `when`: upcoming (not started), now (started in the last 3 hours) or all
 * (both). The backend never returns finished events.
 */
export function useEventSearch({ q, category, when }: { q: string; category: CategoryId | null; when: EventWhen }) {
  // Ticketmaster's keyword match ignores case, so "Jazz" and "jazz" share one cached result.
  const params = { q: q.trim().toLowerCase() || undefined, category: category ?? undefined, when };
  return useInfiniteQuery({
    queryKey: queryKeys.events(params),
    // Passing `signal` makes search restartable: an old search still loading is cancelled when the search changes.
    queryFn: ({ pageParam, signal }) => eventsApi.search({ ...params, page: pageParam, size: PAGE_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    ...cacheTimes.events,
  });
}

/**
 * Event details. A saved event's full copy (kept on the phone for offline use) is used straight away and refreshed
 * when online; otherwise the list's summary shows while the full event (with description) loads.
 */
export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: async ({ signal }) => (await eventsApi.get(id, signal)).event,
    initialData: () => findSavedEvent(id),
    initialDataUpdatedAt: () => queryClient.getQueryState(queryKeys.savedEvents)?.dataUpdatedAt,
    placeholderData: () => findSummary(id) as never,
    ...cacheTimes.event,
  });
}

/** Looks for an event in the cached search pages (so details open instantly from the list). */
function findSummary(id: string): EventSummary | undefined {
  for (const [, data] of queryClient.getQueriesData<{ pages: EventPage[] }>({ queryKey: ['events'] })) {
    for (const page of data?.pages ?? []) {
      const hit = page.items.find((item) => item.id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}
