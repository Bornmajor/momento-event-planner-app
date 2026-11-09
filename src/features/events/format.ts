import type { EventSummary } from '@/api/endpoints';

/**
 * Event date in the venue's local time, as Ticketmaster gives it (localDate + localTime), e.g. "Sat, 12 Dec · 19:30".
 * Formatted in UTC from the local parts so the device's own time zone never shifts it.
 */
export function formatEventDate(start: EventSummary['start'], locale: string): string {
  const [y, m, d] = start.localDate.split('-').map(Number);
  const [hh = 0, mm = 0] = (start.localTime ?? '').split(':').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const day = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
  if (!start.localTime) return day;
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(date);
  return `${day} · ${time}`;
}

/** "Venue, City" (whatever parts exist), or null. */
export function formatVenue(venue: EventSummary['venue']): string | null {
  if (!venue) return null;
  return [venue.name, venue.city].filter(Boolean).join(', ') || null;
}

/** Ticketmaster allows (page + 1) * size ≤ 1000 (backend spec), so paging stops there too. */
export const PAGE_SIZE = 20;
const MAX_RESULTS = 1000;

export function nextPageParam(last: { page: number; size: number; totalPages: number }): number | undefined {
  const next = last.page + 1;
  if (next >= last.totalPages) return undefined;
  if ((next + 1) * last.size > MAX_RESULTS) return undefined;
  return next;
}
