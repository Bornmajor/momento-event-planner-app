import type { components, operations } from '@/core/api/schema';

/** The API's JSON shapes, generated from the backend's OpenAPI spec (npm run gen:api). */
type Schemas = components['schemas'];

export type EventSummaryDto = Schemas['EventSummary'];
export type EventDto = Schemas['Event'];
export type CategoryDto = Schemas['Category'];
export type EventSearchQueryDto = NonNullable<operations['searchEvents']['parameters']['query']>;
export type EventPageDto = operations['searchEvents']['responses'][200]['content']['application/json'];
