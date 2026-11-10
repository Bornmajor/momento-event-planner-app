import { ApiError, fieldErrors, NetworkError, RequestCancelledError } from '@/core/api/api-error';

import {
  AppFailure,
  CancelledFailure,
  NetworkFailure,
  RateLimitedFailure,
  RejectedFailure,
  ServerUnavailableFailure,
  UnauthenticatedFailure,
  UnknownFailure,
  ValidationFailure,
} from './app-failure';

/**
 * Turns a raw error from the data layer into a domain failure, for the codes every feature shares. Repositories
 * check their own codes first (e.g. EMAIL_TAKEN → EmailTakenFailure), then call this for everything else.
 * A value that is already a failure is returned unchanged.
 */
export function mapApiError(error: unknown): AppFailure {
  if (error instanceof AppFailure) return error;
  if (error instanceof RequestCancelledError) return new CancelledFailure();
  if (error instanceof NetworkError) return new NetworkFailure();
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'SERVER_UNREACHABLE':
      case 'UPSTREAM_UNAVAILABLE':
      case 'INTERNAL':
        return new ServerUnavailableFailure(error.code);
      case 'UNAUTHENTICATED':
        return new UnauthenticatedFailure();
      case 'RATE_LIMITED':
        return new RateLimitedFailure();
      case 'VALIDATION_ERROR':
        return new ValidationFailure(fieldErrors(error));
      default:
        return new RejectedFailure(error.code);
    }
  }
  return new UnknownFailure({ cause: error });
}
