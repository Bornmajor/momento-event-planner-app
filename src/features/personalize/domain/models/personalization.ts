import type { Language } from '@/features/auth';

/** What the AI should do: shorten, and/or translate into a language. */
export interface PersonalizeOptions {
  shorten: boolean;
  translateTo?: Language;
}

/**
 * Exact facts written into the calendar notes. The AI never rewrites them (intent §4.4): dates, venue and links are
 * kept exactly as given.
 */
export interface CalendarFacts {
  dateTimeText: string;
  venueText: string | null;
  url: string;
}

export interface Personalization {
  title: string;
  description: string;
  facts: CalendarFacts;
  /** True when the same request was personalized before (instant, no AI call). */
  cached: boolean;
}
