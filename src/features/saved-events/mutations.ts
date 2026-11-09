import { useMutation, useQuery } from '@tanstack/react-query';

import { meApi, savedEventsApi, type Event, type Language, type SavedEventView } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import { snackbar } from '@/components/ui/snackbar';
import i18n from '@/lib/i18n';
import { cacheTimes, queryClient, queryKeys } from '@/lib/query-client';

/**
 * Offline-first saved events (spec §5.2). The list lives in the query cache, which is persisted to the phone, so My
 * Events opens offline from the last copy. Save, remove and the language change are mutations that pause while
 * offline, stay in the persisted cache, and run when the connection returns, even after an app restart. A paused
 * mutation comes back from storage without its function, so each one is registered here by key. This module is
 * imported by the root layout before the cache is restored.
 */

export const saveEventKey = ['save-event'] as const;
export const removeSavedEventKey = ['remove-saved-event'] as const;
export const updateLanguageKey = ['update-language'] as const;

/** The backend allows 100 saved events; 50 is its page size limit, so two pages cover everything. */
const PAGE_SIZE = 50;

async function fetchAllSaved(): Promise<SavedEventView[]> {
  const first = await savedEventsApi.list(0, PAGE_SIZE);
  if (first.totalItems <= PAGE_SIZE) return first.items;
  const second = await savedEventsApi.list(1, PAGE_SIZE);
  return [...first.items, ...second.items];
}

/** The user's saved events, newest first, each with the event's current details (null when it's gone). */
export function useSavedEvents() {
  return useQuery({ queryKey: queryKeys.savedEvents, queryFn: fetchAllSaved, ...cacheTimes.savedEvents });
}

/** The full event from the saved list, used by details when offline. */
export function findSavedEvent(eventId: string): Event | undefined {
  return queryClient.getQueryData<SavedEventView[]>(queryKeys.savedEvents)?.find((s) => s.eventId === eventId)?.event ?? undefined;
}

const setSaved = (update: (items: SavedEventView[]) => SavedEventView[]) =>
  queryClient.setQueryData<SavedEventView[]>(queryKeys.savedEvents, (items) => (items ? update(items) : items));

// ---- Save -------------------------------------------------------------------------------------------------------

export interface SaveVariables {
  eventId: string;
  /** The event as shown, so it appears in My Events immediately (also offline). */
  event?: Event;
}

/** Older queued saves stored just the id. */
const saveVariables = (v: SaveVariables | string): SaveVariables => (typeof v === 'string' ? { eventId: v } : v);

queryClient.setMutationDefaults(saveEventKey, {
  mutationFn: (v: SaveVariables | string) => savedEventsApi.save(saveVariables(v).eventId),
  onMutate: (v: SaveVariables | string) => {
    const { eventId, event } = saveVariables(v);
    if (!event) return;
    setSaved((items) =>
      items.some((s) => s.eventId === eventId)
        ? items
        : [{ eventId, savedAt: new Date().toISOString(), available: true, event }, ...items],
    );
  },
  onError: (error: unknown, v: SaveVariables | string) => {
    // Saved offline, but the event was removed at the source before the save reached the server (spec §5.2).
    if (error instanceof ApiError && error.status === 404) {
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
  mutationFn: (eventId: string) => savedEventsApi.remove(eventId),
  // Optimistic: gone from the list at once, online or not. The persisted cache keeps it gone across a restart.
  onMutate: async (eventId: string) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.savedEvents });
    const previous = queryClient.getQueryData<SavedEventView[]>(queryKeys.savedEvents);
    setSaved((items) => items.filter((s) => s.eventId !== eventId));
    return { previous };
  },
  onError: (_error: unknown, _eventId: string, context: unknown) => {
    const previous = (context as { previous?: SavedEventView[] } | undefined)?.previous;
    if (previous) queryClient.setQueryData(queryKeys.savedEvents, previous);
    snackbar.error(i18n.t('myEvents.removeFailed'));
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.savedEvents }),
});

export function useRemoveSavedEvent() {
  return useMutation<unknown, Error, string>({ mutationKey: removeSavedEventKey });
}

// ---- Language ---------------------------------------------------------------------------------------------------

/** The account's language is the default for AI personalization (intent §4.5). Queued when offline. */
queryClient.setMutationDefaults(updateLanguageKey, {
  mutationFn: (language: Language) => meApi.update({ language }),
  onSuccess: (result: unknown) => queryClient.setQueryData(queryKeys.me, (result as { user: unknown }).user),
});

export function useUpdateLanguage() {
  return useMutation<unknown, Error, Language>({ mutationKey: updateLanguageKey });
}

/** For code outside React (e.g. right after sign-up). */
export function queueLanguageUpdate(language: Language) {
  void queryClient
    .getMutationCache()
    .build(queryClient, { mutationKey: updateLanguageKey })
    .execute(language)
    .catch(() => undefined);
}
