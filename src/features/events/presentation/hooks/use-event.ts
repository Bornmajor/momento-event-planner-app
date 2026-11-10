import { useQuery } from '@tanstack/react-query';

import { cacheTimes, queryClient, queryKeys } from '@/core/query/query-client';
import { findSavedEvent } from '@/features/saved-events/mutations';

import { eventsRepository } from '../../data/events-repository';
import type { EventPage, EventSummary, EventView } from '../../domain/models/event';

/**
 * Event details. A saved event's full copy (kept on the phone for offline use) is used straight away and refreshed
 * when online; otherwise the list's summary shows while the full event (with description) loads.
 */
export function useEvent(id: string) {
  return useQuery<EventView>({
    queryKey: queryKeys.event(id),
    queryFn: ({ signal }) => eventsRepository.get(id, signal),
    initialData: () => findSavedEvent(id),
    initialDataUpdatedAt: () => queryClient.getQueryState(queryKeys.savedEvents)?.dataUpdatedAt,
    placeholderData: () => findSummary(id),
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
