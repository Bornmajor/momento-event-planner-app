import { createCalendarEntry, deleteCalendarEntry, requestCalendarAccess } from '@/core/calendar/device-calendar';
import { getCalendarEntryId, useCalendarEntries } from '@/features/saved-events';

import type { CalendarEntryLinks, DeviceCalendar } from '../domain/ports';

/** The phone's calendar (core/calendar) as the add-to-calendar use case sees it. */
export const deviceCalendar: DeviceCalendar = {
  requestAccess: requestCalendarAccess,
  createEntry: createCalendarEntry,
  deleteEntry: deleteCalendarEntry,
};

/** The event → calendar entry links that saved events keeps per user. */
export const calendarEntryLinks: CalendarEntryLinks = {
  find: (userId, eventId) => getCalendarEntryId(userId, eventId),
  remember: (userId, eventId, calendarEventId) => useCalendarEntries.getState().set(userId, eventId, calendarEventId),
};
