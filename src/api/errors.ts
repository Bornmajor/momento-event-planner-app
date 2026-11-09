/** An error response from the Momento API: `{ error: { code, message, details? } }` (backend docs). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The request never got a response: offline, DNS failure, or timeout. */
export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

/** Translation key for an error (`errors.<CODE>`), for showing a message to the user. */
export function errorMessageKey(error: unknown): string {
  if (error instanceof ApiError) return `errors.${error.code}`;
  if (error instanceof NetworkError) return 'errors.NETWORK';
  return 'errors.UNKNOWN';
}

/** Field errors from a VALIDATION_ERROR, keyed by field path (for forms). */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return {};
  const result: Record<string, string> = {};
  for (const item of error.details as { path?: unknown; message?: unknown }[]) {
    if (typeof item.path === 'string' && typeof item.message === 'string') result[item.path] = item.message;
  }
  return result;
}
