import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { eventsApi, type CategoryId, type EventPage, type EventSearchParams, type EventSummary } from '@/api/endpoints';
import { cacheTimes, queryClient, queryKeys } from '@/lib/query-client';

import { nextPageParam, PAGE_SIZE } from './format';

/** The fixed category list (cached for the app's lifetime). */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => (await eventsApi.categories()).items,
    ...cacheTimes.categories,
  });
}

export type EventWhen = NonNullable<EventSearchParams['when']>;

/**
 * Infinite event search, soonest first. `when`: upcoming (not started), now (started in the last 3 hours) or all
 * (both). The backend never returns finished events.
 */
export function useEventSearch({ q, category, when }: { q: string; category: CategoryId | null; when: EventWhen }) {
  const params = { q: q.trim() || undefined, category: category ?? undefined, when };
  return useInfiniteQuery({
    queryKey: queryKeys.events(params),
    queryFn: ({ pageParam }) => eventsApi.search({ ...params, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    ...cacheTimes.events,
  });
}

/** Event details. Shows the list's summary straight away while the full event (with description) loads. */
export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: async () => (await eventsApi.get(id)).event,
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
