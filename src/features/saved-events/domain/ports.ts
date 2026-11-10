import type { SavedEvent } from './models/saved-event';

/** Saved events on the server. Throws domain failures (EventNotFoundFailure, SavedLimitFailure, shared ones). */
export interface SavedEventsRepository {
  /** All saved events, newest first. */
  list(): Promise<SavedEvent[]>;
  save(eventId: string): Promise<void>;
  remove(eventId: string): Promise<void>;
}

/** Which device calendar entry this phone created for a saved event, per user. */
export interface CalendarEntries {
  find(userId: string, eventId: string): string | undefined;
  forget(userId: string, eventId: string): void;
}

export interface RemoveSavedEventDeps {
  entries: CalendarEntries;
  /** Deletes an entry from the device calendar (works offline). */
  deleteCalendarEntry(calendarEventId: string): Promise<void>;
  /** Sends the server removal now, or queues it until back online. */
  queueServerRemoval(eventId: string): void;
}
