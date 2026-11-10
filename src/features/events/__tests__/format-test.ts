import { hasStarted, nextPageParam } from '../domain/event-rules';
import { formatEventDate, formatVenue, formatVenueTime } from '../presentation/format';

describe('event formatting', () => {
  // A London show at 19:30 local time (19:30 UTC in December).
  const london = { localDate: '2026-12-12', localTime: '19:30:00', dateTime: '2026-12-12T19:30:00Z', timezone: 'Europe/London' };

  it("shows the start in the user's own time zone", () => {
    expect(formatEventDate(london, 'en-GB', 'Africa/Nairobi')).toBe('Sat 12 Dec · 22:30');
    expect(formatEventDate(london, 'en-GB', 'Europe/London')).toBe('Sat 12 Dec · 19:30');
  });

  it("keeps the venue's date when the time isn't announced", () => {
    const tba = { localDate: '2026-12-12', localTime: null, dateTime: null, timezone: 'Europe/London' };
    expect(formatEventDate(tba, 'en-GB', 'Africa/Nairobi')).toBe('Sat 12 Dec');
  });

  it("adds the venue's own time only when it differs from the user's", () => {
    expect(formatVenueTime(london, 'en-GB', 'Africa/Nairobi')).toBe('Sat 12 Dec · 19:30');
    expect(formatVenueTime(london, 'en-GB', 'Europe/London')).toBeNull();
  });

  it('knows when an event has started', () => {
    expect(hasStarted(london, Date.parse('2026-12-12T19:31:00Z'))).toBe(true);
    expect(hasStarted(london, Date.parse('2026-12-12T19:29:00Z'))).toBe(false);
  });

  it('joins the venue name and city', () => {
    expect(formatVenue({ name: 'O2 Arena', city: 'London', country: 'GB', address: null })).toBe('O2 Arena, London');
    expect(formatVenue(null)).toBeNull();
  });

  it('stops paging at the last page and at Ticketmaster’s 1,000-result limit', () => {
    expect(nextPageParam({ page: 0, size: 20, totalPages: 3 })).toBe(1);
    expect(nextPageParam({ page: 2, size: 20, totalPages: 3 })).toBeUndefined();
    expect(nextPageParam({ page: 48, size: 20, totalPages: 200 })).toBe(49);
    expect(nextPageParam({ page: 49, size: 20, totalPages: 200 })).toBeUndefined();
  });
});
