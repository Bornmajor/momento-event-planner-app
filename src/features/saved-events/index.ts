/**
 * Saved events' public API: the only saved-events imports other features may use (spec §12.1). The My Events
 * screen is reached through its route file in src/app.
 */
export type { SavedEvent } from './domain/models/saved-event';
export { SavedLimitFailure } from './domain/failures';
export { getCalendarEntryId, useCalendarEntries } from './data/sources/calendar-entries-local-source';
export { findSavedEvent } from './presentation/hooks/use-saved-events';
export { useSaveEvent } from './presentation/offline-mutations';
