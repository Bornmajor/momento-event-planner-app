import { AppFailure } from '@/core/failures';

/** The event no longer exists (removed by Ticketmaster, or a stale link). */
export class EventNotFoundFailure extends AppFailure {
  readonly code = 'NOT_FOUND';
  constructor() {
    super('NOT_FOUND');
  }
}
