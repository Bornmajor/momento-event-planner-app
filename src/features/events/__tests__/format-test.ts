import { formatEventDate, formatVenue, nextPageParam } from '../format';

describe('event formatting', () => {
  it("formats the venue's local date and time without shifting time zones", () => {
    const start = { localDate: '2026-12-12', localTime: '19:30:00', dateTime: null, timezone: 'Europe/London' };
    expect(formatEventDate(start, 'en-GB')).toBe('Sat 12 Dec · 19:30');
    expect(formatEventDate({ ...start, localTime: null }, 'en-GB')).toBe('Sat 12 Dec');
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
