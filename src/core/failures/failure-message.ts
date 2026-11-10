import i18n from '@/core/i18n/i18n';

import { asFailure } from './as-failure';

/**
 * The translation key to show for a failure: `errors.<code>`, or `errors.UNKNOWN` when there is no message for that
 * code. Use with `t()`: `snackbar.error(t(failureMessage(error)))`.
 */
export function failureMessage(error: unknown): string {
  const key = `errors.${asFailure(error).code}`;
  return i18n.exists(key) ? key : 'errors.UNKNOWN';
}
