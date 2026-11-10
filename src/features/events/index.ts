/**
 * Events' public API: the only events imports other features may use (spec §12.1). Screens are reached through the
 * route files in src/app, not from here.
 */
export type {
  Category,
  CategoryId,
  Event,
  EventStart,
  EventSummary,
  EventView,
  Venue,
} from './domain/models/event';
export { EventNotFoundFailure } from './domain/failures';
export { deviceTimeZone, formatEventDate, formatVenue, formatVenueTime } from './presentation/format';
export { useEvent } from './presentation/hooks/use-event';
