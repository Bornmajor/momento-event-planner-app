import { api } from '@/core/api/http';
import type { components } from '@/core/api/schema';

/** Types generated from the backend's OpenAPI spec (npm run gen:api). */
type Schemas = components['schemas'];
export type User = Schemas['User'];
export type UpdateMeRequest = Schemas['UpdateMeRequest'];
export type Language = Schemas['Language'];

export const meApi = {
  get: () => api.get<{ user: User }>('/me'),
  update: (body: UpdateMeRequest) => api.patch<{ user: User }>('/me', body),
  delete: () => api.delete<void>('/me'),
};


