import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/core/storage/zustand-storage';

import type { CalendarEntries } from '../../domain/ports';

/**
 * Which device calendar entry belongs to which saved event, kept on this device only (each phone's calendar has its
 * own ids). Keyed by user id, so two accounts on one phone never mix (spec §6).
 */
interface CalendarEntriesState {
  byUser: Record<string, Record<string, string>>;
  set: (userId: string, eventId: string, calendarEventId: string) => void;
  remove: (userId: string, eventId: string) => void;
}

export const useCalendarEntries = create<CalendarEntriesState>()(
  persist(
    (set) => ({
      byUser: {},
      set: (userId, eventId, calendarEventId) =>
        set((state) => ({
          byUser: { ...state.byUser, [userId]: { ...state.byUser[userId], [eventId]: calendarEventId } },
        })),
      remove: (userId, eventId) =>
        set((state) => {
          const entries = { ...state.byUser[userId] };
          delete entries[eventId];
          return { byUser: { ...state.byUser, [userId]: entries } };
        }),
    }),
    { name: 'momento.calendar-entries', storage: zustandStorage },
  ),
);

export function getCalendarEntryId(userId: string | null, eventId: string): string | undefined {
  return userId ? useCalendarEntries.getState().byUser[userId]?.[eventId] : undefined;
}

/** The calendar-entry links as the use cases see them (domain/ports.ts). */
export const calendarEntries: CalendarEntries = {
  find: (userId, eventId) => useCalendarEntries.getState().byUser[userId]?.[eventId],
  forget: (userId, eventId) => useCalendarEntries.getState().remove(userId, eventId),
};
