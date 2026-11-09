import { api } from './http';
import type { components, operations } from './schema';

/** Types generated from the backend's OpenAPI spec (npm run gen:api). */
type Schemas = components['schemas'];
export type User = Schemas['User'];
export type AuthResponse = Schemas['AuthResponse'];
export type TokenPair = Schemas['TokenPair'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type LoginRequest = Schemas['LoginRequest'];
export type UpdateMeRequest = Schemas['UpdateMeRequest'];
export type Event = Schemas['Event'];
export type EventSummary = Schemas['EventSummary'];
export type Category = Schemas['Category'];
export type SavedEventView = Schemas['SavedEventView'];
export type PersonalizeRequest = Schemas['PersonalizeRequest'];
export type PersonalizeResponse = Schemas['PersonalizeResponse'];
export type CategoryId = Schemas['CategoryId'];
export type Language = Schemas['Language'];
export type EventSearchParams = NonNullable<operations['searchEvents']['parameters']['query']>;
export type EventPage = operations['searchEvents']['responses'][200]['content']['application/json'];

export const authApi = {
  register: (body: RegisterRequest) => api.post<AuthResponse>('/auth/register', body, { auth: false }),
  login: (body: LoginRequest) => api.post<AuthResponse>('/auth/login', body, { auth: false }),
  google: (idToken: string) =>
    api.post<AuthResponse & { isNewUser: boolean }>('/auth/google', { idToken }, { auth: false }),
  refresh: (refreshToken: string) => api.post<TokenPair>('/auth/refresh', { refreshToken }, { auth: false }),
  logout: (refreshToken: string) => api.post<void>('/auth/logout', { refreshToken }, { auth: false }),
};

export const meApi = {
  get: () => api.get<{ user: User }>('/me'),
  update: (body: UpdateMeRequest) => api.patch<{ user: User }>('/me', body),
  delete: () => api.delete<void>('/me'),
};

export const eventsApi = {
  // `signal`: lets TanStack Query cancel a request whose result is no longer needed.
  search: (params: EventSearchParams, signal?: AbortSignal) => api.get<EventPage>('/events', { query: params, signal }),
  categories: (signal?: AbortSignal) => api.get<{ items: Category[] }>('/events/categories', { signal }),
  get: (id: string, signal?: AbortSignal) => api.get<{ event: Event }>(`/events/${encodeURIComponent(id)}`, { signal }),
};

export const personalizeApi = {
  run: (eventId: string, body: PersonalizeRequest) =>
    api.post<PersonalizeResponse>(`/events/${encodeURIComponent(eventId)}/personalize`, body),
};

export type SavedEventsPage = { items: SavedEventView[]; page: number; size: number; totalItems: number };

export const savedEventsApi = {
  list: (page = 0, size = 50) => api.get<SavedEventsPage>('/me/saved-events', { query: { page, size } }),
  save: (eventId: string) => api.post<unknown>('/me/saved-events', { eventId }),
  remove: (eventId: string) => api.delete<void>(`/me/saved-events/${encodeURIComponent(eventId)}`),
};
