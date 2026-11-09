import { api } from './http';
import type { components } from './schema';

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
