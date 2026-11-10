import { buildCalendarNotes } from '../calendar-notes';
import { CalendarPermissionFailure } from '../failures';
import type { AddToCalendarDeps, AddToCalendarInput } from '../ports';

/**
 * Writes the (personalized) event to the phone's calendar, remembers the entry for this user, and saves the event to
 * My Events (queued while offline). Adding the same event again replaces the old entry instead of duplicating it.
 * Returns the calendar entry's id. Throws CalendarPermissionFailure when access is refused.
 */
export async function addEventToCalendar(input: AddToCalendarInput, deps: AddToCalendarDeps): Promise<string> {
  const permission = await deps.calendar.requestAccess();
  if (permission !== 'granted') throw new CalendarPermissionFailure(permission);

  const previous = deps.links.find(input.userId, input.event.id);
  if (previous) await deps.calendar.deleteEntry(previous);

  const calendarEventId = await deps.calendar.createEntry({
    start: input.event.start,
    title: input.title.trim() || input.event.title,
    notes: buildCalendarNotes(input.description, input.facts),
    location: input.facts.venueText,
    url: input.facts.url,
    reminderMinutes: input.reminderMinutes,
  });
  deps.links.remember(input.userId, input.event.id, calendarEventId);
  deps.queueSave(input.event);
  return calendarEventId;
}
