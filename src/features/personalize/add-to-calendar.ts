import type { EventSummary, PersonalizeResponse } from '@/api/endpoints';
import { createCalendarEntry, deleteCalendarEntry, requestCalendarAccess, type PermissionResult } from '@/lib/calendar';
import { getCalendarEntryId, useCalendarEntries } from '@/features/saved-events';

import { buildCalendarNotes } from './notes';

/** Calendar access was refused; "blocked" means only the system settings can turn it back on. */
export class CalendarPermissionError extends Error {
  constructor(readonly result: Exclude<PermissionResult, 'granted'>) {
    super(`Calendar permission ${result}`);
    this.name = 'CalendarPermissionError';
  }
}

export interface AddToCalendarInput {
  userId: string;
  event: EventSummary;
  title: string;
  description: string;
  facts: PersonalizeResponse['facts'];
  reminderMinutes: number;
}

/**
 * Writes the (personalized) event to the device calendar and remembers the entry for this user. Adding the same event
 * again replaces the old entry instead of duplicating it. Saving to the server is a separate, offline-capable step.
 */
export async function addToCalendar(input: AddToCalendarInput): Promise<string> {
  const permission = await requestCalendarAccess();
  if (permission !== 'granted') throw new CalendarPermissionError(permission);

  const previous = getCalendarEntryId(input.userId, input.event.id);
  if (previous) await deleteCalendarEntry(previous);

  const calendarEventId = await createCalendarEntry({
    start: input.event.start,
    title: input.title.trim() || input.event.title,
    notes: buildCalendarNotes(input.description, input.facts),
    location: input.facts.venueText,
    url: input.facts.url,
    reminderMinutes: input.reminderMinutes,
  });
  useCalendarEntries.getState().set(input.userId, input.event.id, calendarEventId);
  return calendarEventId;
}
