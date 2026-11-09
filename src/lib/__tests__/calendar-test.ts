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

  it("picks the Google account's main calendar over phone-only, hidden or read-only ones", async () => {
    const account = { name: 'ada@gmail.com', isLocalAccount: false };
    const readOnlyPrimary = { id: 'a', title: 'Holidays', isPrimary: true, allowsModifications: false, source: account };
    const phoneOnly = { id: 'b', title: 'My calendar', allowsModifications: true, source: { name: 'Phone', isLocalAccount: true } };
    const hidden = { id: 'c', title: 'ada@gmail.com', allowsModifications: true, isVisible: false, source: account };
    const main = { id: 'd', title: 'ada@gmail.com', allowsModifications: true, isVisible: true, isSynced: true, source: account };
    getCalendars.mockResolvedValue([readOnlyPrimary, phoneOnly, hidden, main]);

    await expect(getWritableCalendar()).resolves.toBe(main);
    expect(createCalendar).not.toHaveBeenCalled();
  });

  it('creates a local "Momento" calendar when nothing is writable', async () => {
    getCalendars.mockResolvedValue([{ id: 'a', title: 'Holidays', allowsModifications: false }]);
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
