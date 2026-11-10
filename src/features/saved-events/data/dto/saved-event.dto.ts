import type { components } from '@/core/api/schema';

/** The API's JSON shapes, generated from the backend's OpenAPI spec (npm run gen:api). */
export type SavedEventDto = components['schemas']['SavedEventView'];
export type SavedEventsPageDto = { items: SavedEventDto[]; page: number; size: number; totalItems: number };
