import { AppFailure } from '@/core/failures';

/** An account with this email already exists (sign-up), or can't be linked to this Google account. */
export class EmailTakenFailure extends AppFailure {
  readonly code = 'EMAIL_TAKEN';
  constructor() {
    super('EMAIL_TAKEN');
  }
}

/** Wrong email or password. */
export class InvalidCredentialsFailure extends AppFailure {
  readonly code = 'INVALID_CREDENTIALS';
  constructor() {
    super('INVALID_CREDENTIALS');
  }
}

/** Google's sign-in itself failed (not our API): no Play services, or a setup or SDK error. */
export class GoogleSignInFailure extends AppFailure {
  readonly code: 'GOOGLE_NO_PLAY_SERVICES' | 'GOOGLE_FAILED';
  constructor(readonly reason: 'noPlayServices' | 'failed') {
    super(reason);
    this.code = reason === 'noPlayServices' ? 'GOOGLE_NO_PLAY_SERVICES' : 'GOOGLE_FAILED';
  }
}
