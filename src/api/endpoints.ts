import { api } from '@/core/api/http';
import type { components } from '@/core/api/schema';

/** Types generated from the backend's OpenAPI spec (npm run gen:api). */
type Schemas = components['schemas'];
export type User = Schemas['User'];
export type UpdateMeRequest = Schemas['UpdateMeRequest'];
export type Event = Schemas['Event'];
export type EventSummary = Schemas['EventSummary'];
export type PersonalizeRequest = Schemas['PersonalizeRequest'];
export type PersonalizeResponse = Schemas['PersonalizeResponse'];
export type Language = Schemas['Language'];

export const meApi = {
  get: () => api.get<{ user: User }>('/me'),
  update: (body: UpdateMeRequest) => api.patch<{ user: User }>('/me', body),
  delete: () => api.delete<void>('/me'),
};

export const personalizeApi = {
  run: (eventId: string, body: PersonalizeRequest) =>
    api.post<PersonalizeResponse>(`/events/${encodeURIComponent(eventId)}/personalize`, body),
};

