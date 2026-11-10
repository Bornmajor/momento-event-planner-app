import { AppFailure } from '@/core/failures';

/** The account already has the maximum number of saved events (100). */
export class SavedLimitFailure extends AppFailure {
  readonly code = 'SAVED_LIMIT_REACHED';
  constructor() {
    super('SAVED_LIMIT_REACHED');
  }
}
