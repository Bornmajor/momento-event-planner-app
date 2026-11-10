import type { Event } from '@/features/events';

/** An event the user saved. JSON-safe, because the list is persisted for offline use. */
export interface SavedEvent {
  eventId: string;
  /** ISO date-time. */
  savedAt: string;
  /** False when the event is gone at the source (then `event` is null). */
  available: boolean;
  event: Event | null;
}
