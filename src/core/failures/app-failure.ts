/**
 * Domain failures (spec §12): what went wrong, in the app's own terms. Repositories turn raw errors (ApiError,
 * NetworkError, SDK errors) into failures and throw them; presentation turns them into words with failureMessage().
 *
 * `code` names the failure and is also its translation key suffix (`errors.<code>`). Features add their own
 * subclasses (for example auth's EmailTakenFailure) in their `domain/failures.ts`.
 */
export abstract class AppFailure extends Error {
  abstract readonly code: string;
}

/** No connection, DNS failure or timeout. */
export class NetworkFailure extends AppFailure {
  readonly code = 'NETWORK';
}

/** The server or a service behind it isn't working (`code`: SERVER_UNREACHABLE, UPSTREAM_UNAVAILABLE or INTERNAL). */
export class ServerUnavailableFailure extends AppFailure {
  constructor(readonly code: 'SERVER_UNREACHABLE' | 'UPSTREAM_UNAVAILABLE' | 'INTERNAL') {
    super(code);
  }
}

/** The session is over; the user has to sign in again. */
export class UnauthenticatedFailure extends AppFailure {
  readonly code = 'UNAUTHENTICATED';
}

/** Too many requests; try again later. */
export class RateLimitedFailure extends AppFailure {
  readonly code = 'RATE_LIMITED';
}

/** The input was rejected. `fields` maps field paths (e.g. "email") to the server's message. */
export class ValidationFailure extends AppFailure {
  readonly code = 'VALIDATION_ERROR';
  constructor(readonly fields: Record<string, string>) {
    super('VALIDATION_ERROR');
  }
}

/** The request was cancelled because its result was no longer needed. Never shown to the user. */
export class CancelledFailure extends AppFailure {
  readonly code = 'CANCELLED';
}

/**
 * The server refused for a reason this layer doesn't name (e.g. NOT_FOUND, SAVED_LIMIT_REACHED). Feature
 * repositories turn the codes they care about into specific failures first; the rest arrive here with their code.
 */
export class RejectedFailure extends AppFailure {
  constructor(readonly code: string) {
    super(code);
  }
}

/** Anything unexpected. */
export class UnknownFailure extends AppFailure {
  readonly code = 'UNKNOWN';
  constructor(options?: { cause?: unknown }) {
    super('UNKNOWN', options);
  }
}
