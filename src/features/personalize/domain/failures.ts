import { AppFailure } from '@/core/failures';

/** Today's AI personalizations are used up; the original text still works. */
export class AiLimitFailure extends AppFailure {
  readonly code = 'AI_LIMIT_REACHED';
  constructor() {
    super('AI_LIMIT_REACHED');
  }
}

/** Calendar access was refused; "blocked" means only the system settings can turn it back on. */
export class CalendarPermissionFailure extends AppFailure {
  readonly code = 'CALENDAR_PERMISSION';
  constructor(readonly result: 'denied' | 'blocked') {
    super(`Calendar permission ${result}`);
  }
}
