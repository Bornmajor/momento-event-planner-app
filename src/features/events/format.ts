import type { EventSummary } from '@/api/endpoints';

/** The phone's own time zone, e.g. "Africa/Nairobi". */
export const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatDayTime(date: Date, locale: string, timeZone: string, withTime: boolean) {
  const day = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone }).format(date);
  if (!withTime) return day;
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone }).format(date);
  return `${day} · ${time}`;
}

/**
 * Event date and time in the user's own time zone, e.g. "Sat, 12 Dec · 22:30". Ticketmaster gives the start as a UTC
 * instant (`dateTime`), which converts exactly; Ticketmaster itself can't return times in the user's zone.
 * Without a UTC start (time not announced) only the venue's local date is known, so that date is shown as is.
 */
export function formatEventDate(start: EventSummary['start'], locale: string, timeZone = deviceTimeZone()): string {
  if (start.dateTime) return formatDayTime(new Date(start.dateTime), locale, timeZone, true);
  const [y, m, d] = start.localDate.split('-').map(Number);
  return formatDayTime(new Date(Date.UTC(y, m - 1, d)), locale, 'UTC', false);
}

/**
 * The same start in the venue's time zone, for the details screen ("19:30 in Europe/London"), or null when it would
 * read the same as the user's time (same zone, or no exact start).
 */
export function formatVenueTime(start: EventSummary['start'], locale: string, timeZone = deviceTimeZone()): string | null {
  if (!start.dateTime || !start.timezone) return null;
  const date = new Date(start.dateTime);
  const venue = formatDayTime(date, locale, start.timezone, true);
  return venue === formatDayTime(date, locale, timeZone, true) ? null : venue;
}

/** Started already (Ticketmaster gives no end time, so a started event in the list counts as happening now). */
export function hasStarted(start: EventSummary['start'], nowMs = Date.now()): boolean {
  return start.dateTime !== null && Date.parse(start.dateTime) <= nowMs;
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
