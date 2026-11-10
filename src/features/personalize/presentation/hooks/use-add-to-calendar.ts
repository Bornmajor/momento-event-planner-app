import { useSaveEvent } from '@/features/saved-events';

import { calendarEntryLinks, deviceCalendar } from '../../data/device-calendar';
import { addEventToCalendar } from '../../domain/use-cases/add-event-to-calendar';
import type { AddToCalendarInput } from '../../domain/ports';

/** Wires the add-to-calendar use case to the phone's calendar, the entry links and the offline save. */
export function useAddToCalendar() {
  const saveEvent = useSaveEvent();
  return (input: AddToCalendarInput) =>
    addEventToCalendar(input, {
      calendar: deviceCalendar,
      links: calendarEntryLinks,
      // Shows in My Events at once; sent now, or queued and sent when back online.
      queueSave: (event) => saveEvent.mutate({ eventId: event.id, event }),
    });
}
