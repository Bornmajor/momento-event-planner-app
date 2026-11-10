import i18n from '@/core/i18n/i18n';

import { mapApiError } from './map-api-error';

/**
 * The translation key to show for a failure: `errors.<code>`, or `errors.UNKNOWN` when there is no message for that
 * code. Raw errors are accepted too (they are mapped first), so callers can pass whatever a query or mutation threw.
 * Use with `t()`: `snackbar.error(t(failureMessage(error)))`.
 */
export function failureMessage(error: unknown): string {
  const key = `errors.${mapApiError(error).code}`;
  return i18n.exists(key) ? key : 'errors.UNKNOWN';
}
