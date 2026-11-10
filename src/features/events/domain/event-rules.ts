import type { EventStart } from './models/event';

/** Started already (Ticketmaster gives no end time, so a started event in the list counts as happening now). */
export function hasStarted(start: EventStart, nowMs = Date.now()): boolean {
  return start.dateTime !== null && Date.parse(start.dateTime) <= nowMs;
}

/** Events per page in Explore. */
export const PAGE_SIZE = 20;

/** Ticketmaster allows (page + 1) * size ≤ 1000 (backend spec), so paging stops there too. */
const MAX_RESULTS = 1000;

/** The next page to load, or undefined at the end of the results. */
export function nextPageParam(last: { page: number; size: number; totalPages: number }): number | undefined {
  const next = last.page + 1;
  if (next >= last.totalPages) return undefined;
  if ((next + 1) * last.size > MAX_RESULTS) return undefined;
  return next;
}
