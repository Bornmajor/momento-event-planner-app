import { api } from '@/core/api/http';

import type { UpdateMeRequestDto, UserResponseDto } from '../dto/profile.dto';

/** The `/me` endpoints: DTOs in and out, raw errors. */
export const meRemoteSource = {
  get: () => api.get<UserResponseDto>('/me'),
  update: (body: UpdateMeRequestDto) => api.patch<UserResponseDto>('/me', body),
  delete: () => api.delete<void>('/me'),
};
