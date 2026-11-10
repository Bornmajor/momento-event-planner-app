import { useSession } from '@/features/auth';
import { deleteCalendarEntry } from '@/lib/calendar';

import { calendarEntries } from '../../data/sources/calendar-entries-local-source';
import { removeSavedEvent } from '../../domain/use-cases/remove-saved-event';
import { useRemoveSavedEvent } from '../offline-mutations';

/** Removes a saved event everywhere: calendar entry now, server now or when back online (remove-saved-event). */
export function useRemoveEvent() {
  const userId = useSession((s) => s.userId);
  const removeSaved = useRemoveSavedEvent();

  return (eventId: string) =>
    removeSavedEvent(userId, eventId, {
      entries: calendarEntries,
      deleteCalendarEntry,
      queueServerRemoval: (id) => removeSaved.mutate(id),
    });
}
