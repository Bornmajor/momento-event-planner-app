import { useInfiniteQuery } from '@tanstack/react-query';

import { cacheTimes, queryKeys } from '@/core/query/query-client';

import { eventsRepository } from '../../data/events-repository';
import { nextPageParam, PAGE_SIZE } from '../../domain/event-rules';
import type { CategoryId, EventWhen } from '../../domain/models/event';

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
    queryFn: ({ pageParam, signal }) => eventsRepository.search({ ...params, page: pageParam, size: PAGE_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    ...cacheTimes.events,
  });
}
