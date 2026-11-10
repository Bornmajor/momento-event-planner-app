import { useSession } from '@/features/auth';
import { deleteCalendarEntry } from '@/lib/calendar';

import { getCalendarEntryId, useCalendarEntries } from './calendar-entries';
import { useRemoveSavedEvent } from './mutations';

/**
 * Removes a saved event everywhere (spec §6): the calendar entry this phone created is deleted right away (works
 * offline, it's the device calendar), and the server removal is sent now or queued until back online.
 */
export function useRemoveEvent() {
  const userId = useSession((s) => s.userId);
  const removeSaved = useRemoveSavedEvent();

  return (eventId: string) => {
    const calendarEventId = getCalendarEntryId(userId, eventId);
    if (calendarEventId) void deleteCalendarEntry(calendarEventId);
    if (userId) useCalendarEntries.getState().remove(userId, eventId);
    removeSaved.mutate(eventId);
  };
}
