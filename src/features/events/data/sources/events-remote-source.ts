import { api } from '@/core/api/http';

import type { CategoryDto, EventDto, EventPageDto, EventSearchQueryDto } from '../dto/event.dto';

/**
 * The `/events` endpoints: DTOs in and out, raw errors. `signal` lets TanStack Query cancel a request whose result
 * is no longer needed (restartable search).
 */
export const eventsRemoteSource = {
  search: (query: EventSearchQueryDto, signal?: AbortSignal) => api.get<EventPageDto>('/events', { query, signal }),
  categories: (signal?: AbortSignal) => api.get<{ items: CategoryDto[] }>('/events/categories', { signal }),
  get: (id: string, signal?: AbortSignal) => api.get<{ event: EventDto }>(`/events/${encodeURIComponent(id)}`, { signal }),
};
