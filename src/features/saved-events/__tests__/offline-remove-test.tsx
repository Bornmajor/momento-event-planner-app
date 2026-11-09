import { onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import '@/lib/i18n';

jest.mock('@/api/endpoints', () => ({
  savedEventsApi: { list: jest.fn(), save: jest.fn(), remove: jest.fn() },
  meApi: { update: jest.fn() },
}));
jest.mock('@/features/auth/session', () => ({
  onSessionEnd: jest.fn(),
  useSession: (select: (s: { userId: string }) => unknown) => select({ userId: 'u1' }),
}));
jest.mock('@/lib/calendar', () => ({ deleteCalendarEntry: jest.fn(async () => undefined) }));

// eslint-disable-next-line import/first -- mocks must be registered first
import { savedEventsApi } from '@/api/endpoints';
// eslint-disable-next-line import/first
import { deleteCalendarEntry } from '@/lib/calendar';
// eslint-disable-next-line import/first
import { queryClient, queryKeys } from '@/lib/query-client';
// eslint-disable-next-line import/first
import { useCalendarEntries } from '../calendar-entries';
// eslint-disable-next-line import/first
import '../mutations';
// eslint-disable-next-line import/first
import { useRemoveEvent } from '../use-remove-event';

const saved = (eventId: string) => ({ eventId, savedAt: '2026-11-09T10:00:00Z', available: true, event: null });
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

afterEach(() => {
  onlineManager.setOnline(true);
  queryClient.clear();
  jest.clearAllMocks();
});

describe('removing a saved event offline', () => {
  it('updates the list and the calendar at once, and sends the removal when back online', async () => {
    (savedEventsApi.remove as jest.Mock).mockResolvedValue(undefined);
    (savedEventsApi.list as jest.Mock).mockResolvedValue({ items: [saved('B')], page: 0, size: 50, totalItems: 1 });
    queryClient.setQueryData(queryKeys.savedEvents, [saved('A'), saved('B')]);
    useCalendarEntries.getState().set('u1', 'A', 'cal-A');

    onlineManager.setOnline(false);
    const { result } = await renderHook(() => useRemoveEvent(), { wrapper });
    await act(async () => result.current('A'));

    // Immediately, while offline: gone from the list, calendar entry deleted, server call waiting.
    await waitFor(() => expect(queryClient.getQueryData<{ eventId: string }[]>(queryKeys.savedEvents)?.map((s) => s.eventId)).toEqual(['B']));
    expect(deleteCalendarEntry).toHaveBeenCalledWith('cal-A');
    expect(useCalendarEntries.getState().byUser.u1?.A).toBeUndefined();
    expect(savedEventsApi.remove).not.toHaveBeenCalled();
    expect(queryClient.getMutationCache().getAll()[0]?.state.isPaused).toBe(true);

    // Back online: the queued removal goes out.
    await act(async () => {
      onlineManager.setOnline(true);
      await queryClient.resumePausedMutations();
    });
    await waitFor(() => expect(savedEventsApi.remove).toHaveBeenCalledWith('A'));
  });
});
