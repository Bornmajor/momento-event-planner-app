import type { Event, EventSummary } from '@/features/events';

import type { CalendarFacts, Personalization, PersonalizeOptions } from './models/personalization';

/** The AI personalization on the server. Throws AiLimitFailure or a shared failure. */
export interface PersonalizeRepository {
  personalize(eventId: string, options: PersonalizeOptions): Promise<Personalization>;
}

export interface CalendarEntry {
  start: EventSummary['start'];
  title: string;
  notes: string;
  location: string | null;
  url: string;
  reminderMinutes: number;
}

/** The phone's calendar. */
export interface DeviceCalendar {
  requestAccess(): Promise<'granted' | 'denied' | 'blocked'>;
  /** Creates an entry and returns its id. */
  createEntry(entry: CalendarEntry): Promise<string>;
  deleteEntry(calendarEventId: string): Promise<void>;
}

/** Which calendar entry this phone created for an event, per user (kept by saved events). */
export interface CalendarEntryLinks {
  find(userId: string, eventId: string): string | undefined;
  remember(userId: string, eventId: string, calendarEventId: string): void;
}

export interface AddToCalendarDeps {
  calendar: DeviceCalendar;
  links: CalendarEntryLinks;
  /** Adds the event to My Events: sent now, or queued until back online. */
  queueSave(event: Event): void;
}

export interface AddToCalendarInput {
  userId: string;
  event: Event;
  title: string;
  description: string;
  facts: CalendarFacts;
  reminderMinutes: number;
}
