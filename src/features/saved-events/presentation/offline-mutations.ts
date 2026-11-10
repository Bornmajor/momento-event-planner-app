import { useMutation } from '@tanstack/react-query';

import { snackbar } from '@/components/ui/snackbar';
import i18n from '@/core/i18n/i18n';
import { queryClient, queryKeys } from '@/core/query/query-client';
import { EventNotFoundFailure, type Event } from '@/features/events';

import { savedEventsRepository } from '../data/saved-events-repository';
import type { SavedEvent } from '../domain/models/saved-event';

/**
 * Offline-first save and remove (spec §5.2). They are mutations that pause while offline, stay in the persisted
 * cache, and run when the connection returns, even after an app restart. A paused mutation comes back from storage
 * without its function, so each one is registered here by key. This module is imported by the root layout before
 * the cache is restored.
 */

export const saveEventKey = ['save-event'] as const;
export const removeSavedEventKey = ['remove-saved-event'] as const;

const setSaved = (update: (items: SavedEvent[]) => SavedEvent[]) =>
  queryClient.setQueryData<SavedEvent[]>(queryKeys.savedEvents, (items) => (items ? update(items) : items));

// ---- Save -------------------------------------------------------------------------------------------------------

export interface SaveVariables {
  eventId: string;
  /** The event as shown, so it appears in My Events immediately (also offline). */
  event?: Event;
}

/** Older queued saves stored just the id. */
const saveVariables = (v: SaveVariables | string): SaveVariables => (typeof v === 'string' ? { eventId: v } : v);

queryClient.setMutationDefaults(saveEventKey, {
  mutationFn: (v: SaveVariables | string) => savedEventsRepository.save(saveVariables(v).eventId),
  onMutate: (v: SaveVariables | string) => {
    const { eventId, event } = saveVariables(v);
    if (!event) return;
    setSaved((items) =>
      items.some((s) => s.eventId === eventId)
        ? items
        : [{ eventId, savedAt: new Date().toISOString(), available: true, event }, ...items],
    );
  },
  onError: (failure: unknown, v: SaveVariables | string) => {
    // Saved offline, but the event was removed at the source before the save reached the server (spec §5.2).
    if (failure instanceof EventNotFoundFailure) {
      const { eventId } = saveVariables(v);
      setSaved((items) => items.filter((s) => s.eventId !== eventId));
      snackbar.error(i18n.t('myEvents.goneWhileOffline'));
    }
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.savedEvents }),
});

export function useSaveEvent() {
  return useMutation<unknown, Error, SaveVariables>({ mutationKey: saveEventKey });
}

// ---- Remove -----------------------------------------------------------------------------------------------------

queryClient.setMutationDefaults(removeSavedEventKey, {
  mutationFn: (eventId: string) => savedEventsRepository.remove(eventId),
  // Optimistic: gone from the list at once, online or not. The persisted cache keeps it gone across a restart.
  onMutate: async (eventId: string) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.savedEvents });
    const previous = queryClient.getQueryData<SavedEvent[]>(queryKeys.savedEvents);
    setSaved((items) => items.filter((s) => s.eventId !== eventId));
    return { previous };
  },
  onError: (_failure: unknown, _eventId: string, context: unknown) => {
    const previous = (context as { previous?: SavedEvent[] } | undefined)?.previous;
    if (previous) queryClient.setQueryData(queryKeys.savedEvents, previous);
    snackbar.error(i18n.t('myEvents.removeFailed'));
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.savedEvents }),
});

export function useRemoveSavedEvent() {
  return useMutation<unknown, Error, string>({ mutationKey: removeSavedEventKey });
}
