import { api } from '@/core/api/http';

import type { SavedEventsPageDto } from '../dto/saved-event.dto';

/** The `/me/saved-events` endpoints: DTOs in and out, raw errors. */
export const savedEventsRemoteSource = {
  list: (page: number, size: number) => api.get<SavedEventsPageDto>('/me/saved-events', { query: { page, size } }),
  save: (eventId: string) => api.post<unknown>('/me/saved-events', { eventId }),
  remove: (eventId: string) => api.delete<void>(`/me/saved-events/${encodeURIComponent(eventId)}`),
};
