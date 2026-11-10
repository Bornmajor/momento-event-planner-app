import { ApiError, NetworkError, RequestCancelledError } from '@/core/api/api-error';
import '@/core/i18n/i18n';
import { shouldRetry } from '@/core/query/query-client';

import {
  asFailure,
  CancelledFailure,
  failureMessage,
  mapApiError,
  NetworkFailure,
  RateLimitedFailure,
  RejectedFailure,
  ServerUnavailableFailure,
  UnknownFailure,
  ValidationFailure,
} from '..';

describe('failures', () => {
  it('maps raw errors to domain failures', () => {
    expect(mapApiError(new NetworkError())).toBeInstanceOf(NetworkFailure);
    expect(mapApiError(new RequestCancelledError())).toBeInstanceOf(CancelledFailure);
    expect(mapApiError(new ApiError(502, 'UPSTREAM_UNAVAILABLE', 'down'))).toEqual(
      new ServerUnavailableFailure('UPSTREAM_UNAVAILABLE'),
    );
    const validation = mapApiError(
      new ApiError(400, 'VALIDATION_ERROR', 'bad', [{ location: 'body', path: 'email', message: 'Invalid email' }]),
    );
    expect(validation).toBeInstanceOf(ValidationFailure);
    expect((validation as ValidationFailure).fields).toEqual({ email: 'Invalid email' });
    // Codes no shared failure names keep their code for the message.
    expect(mapApiError(new ApiError(409, 'SAVED_LIMIT_REACHED', 'full'))).toEqual(new RejectedFailure('SAVED_LIMIT_REACHED'));
    expect(mapApiError(new TypeError('boom'))).toBeInstanceOf(UnknownFailure);
  });

  it('gives a translation key for a failure, falling back to UNKNOWN', () => {
    expect(failureMessage(new NetworkFailure())).toBe('errors.NETWORK');
    expect(failureMessage(new ServerUnavailableFailure('INTERNAL'))).toBe('errors.INTERNAL');
    expect(failureMessage(new RejectedFailure('FORBIDDEN'))).toBe('errors.UNKNOWN'); // no message for it
    // Presentation only interprets failures: anything else (a bug, or a raw error that escaped a repository) is unknown.
    expect(asFailure(new ApiError(409, 'EMAIL_TAKEN', 'taken'))).toBeInstanceOf(UnknownFailure);
    expect(failureMessage(new Error('?'))).toBe('errors.UNKNOWN');
  });

  it('retries only when trying again can help (no connection, server problem), at most twice', () => {
    expect(shouldRetry(0, new NetworkFailure())).toBe(true);
    expect(shouldRetry(1, new ServerUnavailableFailure('UPSTREAM_UNAVAILABLE'))).toBe(true);
    expect(shouldRetry(2, new NetworkFailure())).toBe(false); // already retried twice
    expect(shouldRetry(0, new RejectedFailure('NOT_FOUND'))).toBe(false);
    expect(shouldRetry(0, new RateLimitedFailure())).toBe(false);
    expect(shouldRetry(0, new TypeError('bug'))).toBe(false);
    expect(shouldRetry(0, new CancelledFailure())).toBe(false);
  });

  it('names failures after their class, for readable logs', () => {
    expect(new NetworkFailure().name).toBe('NetworkFailure');
    expect(String(new RejectedFailure('NOT_FOUND'))).toBe('RejectedFailure: NOT_FOUND');
  });
});
