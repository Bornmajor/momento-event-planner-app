import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from '@/core/api/api-error';
import { failureMessage } from '@/core/failures';

/**
 * Puts an API error where the user will see it: on the matching field when the API names one (validation details,
 * EMAIL_TAKEN), otherwise returns a translation key for a message above the button.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): string | null {
  if (error instanceof ApiError) {
    if (error.code === 'EMAIL_TAKEN' && fields.includes('email' as Path<T>)) {
      setError('email' as Path<T>, { message: 'errors.EMAIL_TAKEN' });
      return null;
    }
    if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details)) {
      let placed = false;
      for (const detail of error.details as { path?: unknown }[]) {
        const path = detail.path as Path<T>;
        if (typeof detail.path === 'string' && fields.includes(path)) {
          setError(path, { message: 'errors.VALIDATION_ERROR' });
          placed = true;
        }
      }
      if (placed) return null;
    }
  }
  return failureMessage(error);
}
