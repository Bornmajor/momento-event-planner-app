import { AppFailure, UnknownFailure } from './app-failure';

/**
 * What presentation does with anything a query or mutation threw: repositories throw domain failures, so a failure
 * passes through unchanged; anything else (a bug, an unexpected library error) becomes UnknownFailure. Raw API errors
 * are the data layer's business (mapApiError) and are deliberately not interpreted here.
 */
export function asFailure(error: unknown): AppFailure {
  return error instanceof AppFailure ? error : new UnknownFailure({ cause: error });
}
