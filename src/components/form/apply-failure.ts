import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { asFailure, failureMessage, ValidationFailure } from '@/core/failures';

/**
 * Puts a failure where the user will see it: a ValidationFailure on the matching form fields; anything else returns
 * a translation key for a snackbar (or null when every problem landed on a field).
 */
export function applyFailure<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): string | null {
  const failure = asFailure(error);
  if (failure instanceof ValidationFailure) {
    const matching = Object.keys(failure.fields).filter((path): path is Path<T> => fields.includes(path as Path<T>));
    for (const path of matching) setError(path, { message: 'errors.VALIDATION_ERROR' });
    if (matching.length > 0) return null;
  }
  return failureMessage(failure);
}
