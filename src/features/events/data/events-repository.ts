import { ApiError } from '@/core/api/api-error';
import { mapApiError } from '@/core/failures';

import { EventNotFoundFailure } from '../domain/failures';
import type { Category, Event, EventPage, EventSearch } from '../domain/models/event';
import { toCategory, toEvent, toEventPage } from './mappers/event.mapper';
import { eventsRemoteSource } from './sources/events-remote-source';

/** Raw error → domain failure: a missing event first, then the shared failures (core/failures). */
function toFailure(error: unknown) {
  if (error instanceof ApiError && error.code === 'NOT_FOUND') return new EventNotFoundFailure();
  return mapApiError(error);
}

async function attempt<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toFailure(error);
  }
}

/** Events data: maps DTOs to domain models and raw errors to failures (spec §12.1). Reads only, so no use cases. */
export const eventsRepository = {
  search: (search: EventSearch, signal?: AbortSignal): Promise<EventPage> =>
    attempt(async () => toEventPage(await eventsRemoteSource.search(search, signal))),

  categories: (signal?: AbortSignal): Promise<Category[]> =>
    attempt(async () => (await eventsRemoteSource.categories(signal)).items.map(toCategory)),

  get: (id: string, signal?: AbortSignal): Promise<Event> =>
    attempt(async () => toEvent((await eventsRemoteSource.get(id, signal)).event)),
};
