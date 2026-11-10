import { useQuery } from '@tanstack/react-query';

import { cacheTimes, queryClient, queryKeys } from '@/core/query/query-client';
import type { Event } from '@/features/events';

import { savedEventsRepository } from '../../data/saved-events-repository';
import type { SavedEvent } from '../../domain/models/saved-event';

/**
 * The user's saved events, newest first, each with the event's current details (null when it's gone). The list
 * lives in the persisted query cache, so My Events opens offline from the last copy (spec §5.2).
 */
export function useSavedEvents() {
  return useQuery({ queryKey: queryKeys.savedEvents, queryFn: () => savedEventsRepository.list(), ...cacheTimes.savedEvents });
}

/** The full event from the saved list, used by details when offline. */
export function findSavedEvent(eventId: string): Event | undefined {
  return queryClient.getQueryData<SavedEvent[]>(queryKeys.savedEvents)?.find((s) => s.eventId === eventId)?.event ?? undefined;
}
