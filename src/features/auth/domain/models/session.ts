import type { User } from './user';

/** A short-lived access token (sent with every request) and a single-use refresh token (used to get a new pair). */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** What every sign-in or sign-up produces. */
export interface AuthSession extends TokenPair {
  user: User;
}

export interface GoogleAuthSession extends AuthSession {
  /** True when this Google sign-in created the account. */
  isNewUser: boolean;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpInput extends Credentials {
  firstName: string;
  lastName: string;
}
