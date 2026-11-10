import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/core/api/api-error';
import { SnackbarHost } from '@/components/ui';
import '@/core/i18n/i18n';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('@/features/personalize/data/sources/personalize-remote-source', () => ({ personalizeRemoteSource: { run: jest.fn() } }));
jest.mock('@/features/saved-events/data/sources/saved-events-remote-source', () => ({
  savedEventsRemoteSource: { save: jest.fn(), list: jest.fn() },
}));
jest.mock('@/features/auth', () => ({
  onSessionEnd: jest.fn(),
  useSession: (select: (s: { userId: string }) => unknown) => select({ userId: 'u1' }),
}));
// The phone's calendar: access granted, new entries get id cal-1.
jest.mock('@/core/calendar/device-calendar', () => ({
  requestCalendarAccess: jest.fn(async () => 'granted'),
  createCalendarEntry: jest.fn(async () => 'cal-1'),
  deleteCalendarEntry: jest.fn(async () => undefined),
  openCalendarEntry: jest.fn(),
  openSystemSettings: jest.fn(),
}));

// eslint-disable-next-line import/first -- mocks must be registered first
import { router } from 'expo-router';
// eslint-disable-next-line import/first
import { createCalendarEntry } from '@/core/calendar/device-calendar';
// eslint-disable-next-line import/first
import { savedEventsRemoteSource } from '@/features/saved-events/data/sources/saved-events-remote-source';
// eslint-disable-next-line import/first
import { formatEventDate } from '@/features/events';
// eslint-disable-next-line import/first
import { queryClient } from '@/core/query/query-client';
// eslint-disable-next-line import/first
import '@/features/saved-events/presentation/offline-mutations';
// eslint-disable-next-line import/first
import { useCalendarEntries } from '@/features/saved-events';
// eslint-disable-next-line import/first
import { personalizeRemoteSource } from '../data/sources/personalize-remote-source';
// eslint-disable-next-line import/first
import { PersonalizeForm } from '../presentation/components/personalize-form';

const run = personalizeRemoteSource.run as jest.Mock;

const event = {
  id: 'E1',
  source: 'ticketmaster',
  title: 'Jazz Night',
  url: 'https://tickets.example/E1',
  imageUrl: null,
  start: { localDate: '2026-12-01', localTime: '19:30:00', dateTime: '2026-12-01T19:30:00Z', timezone: 'Europe/London' },
  status: 'onsale',
  category: null,
  genre: null,
  venue: { name: 'Ronnie Scott’s', city: 'London', country: 'GB', address: null },
  priceRange: null,
  description: 'An evening of live jazz with three bands.',
  notes: null,
} as const;

async function renderForm() {
  await render(
    <QueryClientProvider client={queryClient}>
      <PersonalizeForm event={event as never} />
      <SnackbarHost />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('Personalize', () => {
  it('applies the AI result, lets it be edited, and adds it to the calendar with the chosen reminder', async () => {
    run.mockResolvedValue({
      title: 'Usiku wa Jazz',
      description: 'Jioni ya jazz.',
      facts: { dateTimeText: 'Jumanne, 1 Desemba 19:30', venueText: 'Ronnie Scott’s, London', url: event.url },
      cached: true,
    });
    (savedEventsRemoteSource.save as jest.Mock).mockResolvedValue({});
    await renderForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Apply with AI' }));
    await waitFor(() => expect(screen.getByDisplayValue('Usiku wa Jazz')).toBeOnTheScreen());
    expect(run).toHaveBeenCalledWith('E1', { shorten: true });
    expect(screen.getByText('Ready instantly, this was personalized before.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Title'), 'Jazz usiku');
    await fireEvent.press(screen.getByRole('radio', { name: '1 day before' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add to Calendar' }));

    await waitFor(() =>
      expect(createCalendarEntry).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Jazz usiku', location: 'Ronnie Scott’s, London', reminderMinutes: 1440 }),
      ),
    );
    // Notes: the edited description, then the exact facts. The date is the app's own, in the user's time zone,
    // not the backend's venue-time text.
    const { notes } = (createCalendarEntry as jest.Mock).mock.calls[0][0];
    expect(notes).toBe(
      `Jioni ya jazz.\n\n🗓 ${formatEventDate(event.start, 'en')}\n📍 Ronnie Scott’s, London\n🎟 ${event.url}`,
    );
    // The entry is remembered for this user, and the event is saved to My Events.
    expect(useCalendarEntries.getState().byUser.u1?.E1).toBe('cal-1');
    await waitFor(() => expect(savedEventsRemoteSource.save).toHaveBeenCalledWith('E1'));
    expect(router.back).toHaveBeenCalled();
  });

  it('offers the original text when the daily AI limit is reached', async () => {
    run.mockRejectedValue(new ApiError(429, 'AI_LIMIT_REACHED', 'limit'));
    await renderForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Apply with AI' }));

    expect(await screen.findByText(/You've used today's AI personalizations/)).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Jazz Night')).toBeOnTheScreen();
  });
});
