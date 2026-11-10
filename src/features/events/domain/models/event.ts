/** The app's event types (spec §12). JSON-safe: dates and times are strings, because saved events are persisted. */

export type CategoryId = 'music' | 'sports' | 'arts-theatre' | 'film' | 'miscellaneous';

export interface Category {
  id: CategoryId;
  name: string;
}

export type EventStatus = 'onsale' | 'offsale' | 'cancelled' | 'postponed' | 'rescheduled' | 'unknown';

export interface EventStart {
  /** The venue's local date, `YYYY-MM-DD`. Always known. */
  localDate: string;
  /** The venue's local time, `HH:mm:ss`, or null when not announced. */
  localTime: string | null;
  /** The exact start as a UTC instant (ISO), or null when the time isn't announced. */
  dateTime: string | null;
  /** The venue's time zone, e.g. "Europe/London". */
  timezone: string | null;
}

export interface Venue {
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

/** What lists show. */
export interface EventSummary {
  id: string;
  source: 'ticketmaster';
  title: string;
  /** Ticketmaster's page for the event (tickets). */
  url: string;
  imageUrl: string | null;
  start: EventStart;
  status: EventStatus;
  category: Category | null;
  genre: string | null;
  venue: Venue | null;
  priceRange: PriceRange | null;
}

/** The full event, with the texts the details screen and Personalize use. */
export interface Event extends EventSummary {
  description: string | null;
  notes: string | null;
}

/** A summary that may already have its full texts (details open from the list before the full event loads). */
export type EventView = EventSummary & Partial<Pick<Event, 'description' | 'notes'>>;

/** Which events to search: not started yet, started in the last 3 hours, or both. */
export type EventWhen = 'upcoming' | 'now' | 'all';

export interface EventSearch {
  q?: string;
  category?: CategoryId;
  when: EventWhen;
  page: number;
  size: number;
}

export interface EventPage {
  items: EventSummary[];
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
}
