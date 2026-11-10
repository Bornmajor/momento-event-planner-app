import type { AuthSession, Credentials, GoogleAuthSession, SignUpInput, TokenPair } from './models/session';
import type { Language } from './models/user';

/**
 * What the use cases need from the outside world. The data layer implements AuthRepository; presentation implements
 * SessionGateway (it owns the in-memory session) and Preferences. Use cases receive them as arguments, so domain/
 * never imports data/ or presentation/ (spec §12.1).
 *
 * Every method throws domain failures (core/failures, ./failures), never raw API errors.
 */
export interface AuthRepository {
  register(input: SignUpInput): Promise<AuthSession>;
  signIn(credentials: Credentials): Promise<AuthSession>;
  signInWithGoogleToken(idToken: string): Promise<GoogleAuthSession>;
  /** New pair for a refresh token. UnauthenticatedFailure when the server rejects it. */
  refresh(refreshToken: string): Promise<TokenPair>;
  /** Revokes the refresh token on the server. */
  revoke(refreshToken: string): Promise<void>;
  /** Opens Google's account picker: the ID token, or null when the user closes it. */
  pickGoogleAccount(): Promise<string | null>;
  /** Forgets the Google account on the device, so the picker shows next time. Never throws. */
  forgetGoogleAccount(): Promise<void>;
}

/** The current session: tokens on the device plus the in-memory state the screens follow. */
export interface SessionGateway {
  /** Saves the tokens (kept after the app closes only when `remember`) and marks the user signed in. */
  start(session: AuthSession, remember: boolean): Promise<void>;
  /** Clears the tokens and cached data, and marks the user signed out. */
  end(): Promise<void>;
  storedRefreshToken(): Promise<string | null>;
  storedUserId(): Promise<string | null>;
  setUserId(userId: string | null): void;
  /** Saves a rotated pair and marks the user signed in with the new access token. */
  rotate(pair: TokenPair): Promise<void>;
  markSignedOut(): void;
  /** Signed in without an access token (no connection): cached data only until the next refresh. */
  markSignedInOffline(userId: string | null): void;
}

export interface Preferences {
  /** The language the app is shown in. */
  appLanguage(): Language | null;
  /** Saves the language to the account (queued while offline). */
  queueLanguageUpdate(language: Language): void;
}

/** Everything the auth use cases need, wired in presentation (session-controller.ts). */
export interface AuthDeps {
  auth: AuthRepository;
  session: SessionGateway;
  preferences: Preferences;
}
