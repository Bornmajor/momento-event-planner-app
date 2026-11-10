import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/core/api/api-error';
import { SnackbarHost } from '@/components/ui';
import '@/core/i18n/i18n';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('@/api/endpoints', () => ({ personalizeApi: { run: jest.fn() }, savedEventsApi: { save: jest.fn() }, meApi: { update: jest.fn() } }));
jest.mock('@/features/auth/session', () => ({
  onSessionEnd: jest.fn(),
  useSession: (select: (s: { userId: string }) => unknown) => select({ userId: 'u1' }),
}));
jest.mock('@/features/personalize/add-to-calendar', () => ({
  addToCalendar: jest.fn(async () => 'cal-1'),
  CalendarPermissionError: class extends Error {},
}));

// eslint-disable-next-line import/first -- mocks must be registered first
import { router } from 'expo-router';
// eslint-disable-next-line import/first
import { personalizeApi, savedEventsApi } from '@/api/endpoints';
// eslint-disable-next-line import/first
import { formatEventDate } from '@/features/events/format';
// eslint-disable-next-line import/first
import { queryClient } from '@/core/query/query-client';
// eslint-disable-next-line import/first
import '@/features/saved-events/mutations';
// eslint-disable-next-line import/first
import { addToCalendar } from '../add-to-calendar';
// eslint-disable-next-line import/first
import { PersonalizeForm } from '../personalize-form';

const run = personalizeApi.run as jest.Mock;

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
    (savedEventsApi.save as jest.Mock).mockResolvedValue({});
    await renderForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Apply with AI' }));
    await waitFor(() => expect(screen.getByDisplayValue('Usiku wa Jazz')).toBeOnTheScreen());
    expect(run).toHaveBeenCalledWith('E1', { shorten: true });
    expect(screen.getByText('Ready instantly, this was personalized before.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Title'), 'Jazz usiku');
    await fireEvent.press(screen.getByRole('radio', { name: '1 day before' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add to Calendar' }));

    await waitFor(() =>
      expect(addToCalendar).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', title: 'Jazz usiku', description: 'Jioni ya jazz.', reminderMinutes: 1440 }),
      ),
    );
    // The date is the app's own, in the user's time zone, not the backend's venue-time text.
    const { facts } = (addToCalendar as jest.Mock).mock.calls[0][0];
    expect(facts.dateTimeText).toBe(formatEventDate(event.start, 'en'));
    expect(facts.venueText).toBe('Ronnie Scott’s, London');
    await waitFor(() => expect(savedEventsApi.save).toHaveBeenCalledWith('E1'));
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
