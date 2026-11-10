import { ApiError, NetworkError, RequestCancelledError } from '@/core/api/api-error';
import '@/core/i18n/i18n';

import {
  CancelledFailure,
  failureMessage,
  mapApiError,
  NetworkFailure,
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

  it('gives a translation key for any failure or raw error, falling back to UNKNOWN', () => {
    expect(failureMessage(new NetworkError())).toBe('errors.NETWORK');
    expect(failureMessage(new ApiError(409, 'EMAIL_TAKEN', 'taken'))).toBe('errors.EMAIL_TAKEN');
    expect(failureMessage(new ServerUnavailableFailure('INTERNAL'))).toBe('errors.INTERNAL');
    expect(failureMessage(new ApiError(403, 'FORBIDDEN', 'no'))).toBe('errors.UNKNOWN'); // no message for it
    expect(failureMessage(new Error('?'))).toBe('errors.UNKNOWN');
  });
});
