import type { components } from '@/core/api/schema';

/** The API's JSON shapes, generated from the backend's OpenAPI spec (npm run gen:api). */
type Schemas = components['schemas'];

export type UserDto = Schemas['User'];
export type TokenPairDto = Schemas['TokenPair'];
export type AuthResponseDto = Schemas['AuthResponse'];
export type GoogleAuthResponseDto = AuthResponseDto & { isNewUser: boolean };
export type RegisterRequestDto = Schemas['RegisterRequest'];
export type LoginRequestDto = Schemas['LoginRequest'];
