import type { components } from '@/core/api/schema';

/** The API's JSON shapes, generated from the backend's OpenAPI spec (npm run gen:api). */
export type PersonalizeRequestDto = components['schemas']['PersonalizeRequest'];
export type PersonalizeResponseDto = components['schemas']['PersonalizeResponse'];
