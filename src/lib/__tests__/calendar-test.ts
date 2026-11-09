import { buildCalendarNotes } from '@/features/personalize/notes';

jest.mock('expo-calendar', () => ({
  requestCalendarPermissions: jest.fn(),
  getCalendars: jest.fn(),
  createCalendar: jest.fn(),
  getDefaultCalendarSync: jest.fn(),
  EntityTypes: { EVENT: 'event' },
  SourceType: { LOCAL: 'local' },
  CalendarAccessLevel: { OWNER: 'owner' },
  AlarmMethod: { ALERT: 'alert' },
  ExpoCalendarEvent: { get: jest.fn() },
}));

// eslint-disable-next-line import/first -- mocks must be registered first
import * as Calendar from 'expo-calendar';
// eslint-disable-next-line import/first
import { entryTiming, getWritableCalendar } from '../calendar';

const getCalendars = Calendar.getCalendars as jest.Mock;
const createCalendar = Calendar.createCalendar as jest.Mock;

describe('calendar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('builds notes from the description and the exact facts', () => {
    expect(
      buildCalendarNotes('  Jazz night.  ', { dateTimeText: 'Tue 1 Dec · 19:30', venueText: 'Ronnie Scott’s, London', url: 'https://t.co/x' }),
    ).toBe('Jazz night.\n\n🗓 Tue 1 Dec · 19:30\n📍 Ronnie Scott’s, London\n🎟 https://t.co/x');
  });

  it('prefers a primary writable calendar and never picks a read-only one', async () => {
    const readOnlyPrimary = { id: 'a', isPrimary: true, allowsModifications: false };
    const writable = { id: 'b', isPrimary: false, allowsModifications: true };
    const writablePrimary = { id: 'c', isPrimary: true, allowsModifications: true };
    getCalendars.mockResolvedValue([readOnlyPrimary, writable, writablePrimary]);

    await expect(getWritableCalendar()).resolves.toBe(writablePrimary);
    expect(createCalendar).not.toHaveBeenCalled();
  });

  it('creates a local "Momento" calendar when nothing is writable', async () => {
    getCalendars.mockResolvedValue([{ id: 'a', allowsModifications: false }]);
    createCalendar.mockResolvedValue({ id: 'new' });

    await expect(getWritableCalendar()).resolves.toEqual({ id: 'new' });
    expect(createCalendar).toHaveBeenCalledWith(expect.objectContaining({ title: 'Momento', source: expect.objectContaining({ isLocalAccount: true }) }));
  });

  it('uses a 2-hour timed entry with a start time, otherwise an all-day entry', () => {
    const timed = entryTiming({ localDate: '2026-12-01', localTime: '19:30:00', dateTime: '2026-12-01T19:30:00Z', timezone: 'Europe/London' });
    expect(timed).toMatchObject({ allDay: false, timeZone: 'Europe/London' });
    expect(timed.endDate.getTime() - timed.startDate.getTime()).toBe(2 * 60 * 60 * 1000);

    const allDay = entryTiming({ localDate: '2026-12-01', localTime: null, dateTime: null, timezone: null });
    expect(allDay.allDay).toBe(true);
  });
});
