import type { RemoveSavedEventDeps } from '../ports';

/**
 * Removes a saved event everywhere (spec §6): the calendar entry this phone created is deleted right away (the
 * device calendar works offline), the link to it is forgotten, and the server removal is sent now or queued.
 */
export function removeSavedEvent(userId: string | null, eventId: string, deps: RemoveSavedEventDeps): void {
  if (userId) {
    const calendarEventId = deps.entries.find(userId, eventId);
    if (calendarEventId) void deps.deleteCalendarEntry(calendarEventId);
    deps.entries.forget(userId, eventId);
  }
  deps.queueServerRemoval(eventId);
}
