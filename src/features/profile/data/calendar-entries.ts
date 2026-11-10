import { useCalendarEntries } from '@/features/saved-events';

import type { DeleteAccountDeps } from '../domain/ports';

/** Saved events' calendar-entry links, as the delete-account use case sees them. */
export const calendarEntriesForAccount: DeleteAccountDeps['calendarEntries'] = {
  all: (userId) => Object.values(useCalendarEntries.getState().byUser[userId] ?? {}),
  forgetAll: (userId) =>
    useCalendarEntries.setState((state) => {
      const byUser = { ...state.byUser };
      delete byUser[userId];
      return { byUser };
    }),
};
