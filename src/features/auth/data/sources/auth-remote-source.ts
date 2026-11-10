import { api } from '@/core/api/http';

import type {
  AuthResponseDto,
  GoogleAuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  TokenPairDto,
} from '../dto/auth.dto';

/** The `/auth/*` endpoints: DTOs in and out, raw errors (ApiError, NetworkError). All public (no access token). */
export const authRemoteSource = {
  register: (body: RegisterRequestDto) => api.post<AuthResponseDto>('/auth/register', body, { auth: false }),
  login: (body: LoginRequestDto) => api.post<AuthResponseDto>('/auth/login', body, { auth: false }),
  google: (idToken: string) => api.post<GoogleAuthResponseDto>('/auth/google', { idToken }, { auth: false }),
  refresh: (refreshToken: string) => api.post<TokenPairDto>('/auth/refresh', { refreshToken }, { auth: false }),
  logout: (refreshToken: string) => api.post<void>('/auth/logout', { refreshToken }, { auth: false }),
};
