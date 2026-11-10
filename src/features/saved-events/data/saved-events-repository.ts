import { ApiError } from '@/core/api/api-error';
import { mapApiError } from '@/core/failures';
import { EventNotFoundFailure } from '@/features/events';

import { SavedLimitFailure } from '../domain/failures';
import type { SavedEventsRepository } from '../domain/ports';
import { toSavedEvent } from './mappers/saved-event.mapper';
import { savedEventsRemoteSource } from './sources/saved-events-remote-source';

/** The backend allows 100 saved events; 50 is its page size limit, so two pages cover everything. */
const PAGE_SIZE = 50;

/** Raw error → domain failure: saved events' own codes first, then the shared ones (core/failures). */
function toFailure(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'NOT_FOUND') return new EventNotFoundFailure();
    if (error.code === 'SAVED_LIMIT_REACHED') return new SavedLimitFailure();
  }
  return mapApiError(error);
}

async function attempt<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toFailure(error);
  }
}

/** Saved events data: maps DTOs to domain models and raw errors to failures (spec §12.1). */
export const savedEventsRepository: SavedEventsRepository = {
  list: () =>
    attempt(async () => {
      const first = await savedEventsRemoteSource.list(0, PAGE_SIZE);
      const items =
        first.totalItems <= PAGE_SIZE ? first.items : [...first.items, ...(await savedEventsRemoteSource.list(1, PAGE_SIZE)).items];
      return items.map(toSavedEvent);
    }),

  save: (eventId) =>
    attempt(async () => {
      await savedEventsRemoteSource.save(eventId);
    }),

  remove: (eventId) => attempt(() => savedEventsRemoteSource.remove(eventId)),
};
