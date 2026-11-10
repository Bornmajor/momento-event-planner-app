/* eslint-disable no-console -- the only place allowed to use console (spec §9.2) */

/**
 * App logger. Does nothing in release builds (`__DEV__` is false), so production prints nothing from our code.
 * Never pass tokens, passwords or whole API responses.
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (__DEV__) console.debug('[momento]', ...args);
  },
  info: (...args: unknown[]) => {
    if (__DEV__) console.info('[momento]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn('[momento]', ...args);
  },
  error: (...args: unknown[]) => {
    if (__DEV__) console.error('[momento]', ...args);
  },
};
