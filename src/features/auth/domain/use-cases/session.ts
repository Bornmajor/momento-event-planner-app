import { UnauthenticatedFailure } from '@/core/failures';
import { logger } from '@/core/logger';

import type { AuthDeps } from '../ports';

type SessionDeps = Pick<AuthDeps, 'auth' | 'session'>;

/**
 * Exchanges the stored refresh token for a new pair (docs/authentication.md). Only UnauthenticatedFailure (the
 * server rejected the token) ends the session; no connection or a server problem keeps it, so the app keeps working
 * offline and tries again later.
 */
export async function refreshAccessToken(deps: SessionDeps): Promise<string> {
  const refreshToken = await deps.session.storedRefreshToken();
  if (!refreshToken) {
    await deps.session.end();
    throw new UnauthenticatedFailure();
  }
  try {
    const pair = await deps.auth.refresh(refreshToken);
    await deps.session.rotate(pair);
    return pair.accessToken;
  } catch (failure) {
    if (failure instanceof UnauthenticatedFailure) await deps.session.end();
    throw failure;
  }
}

/**
 * Start-up: no stored token → signed out; refresh OK → signed in; token rejected → signed out; no connection or a
 * server problem → signed in offline, using cached data.
 */
export async function restoreSession(deps: SessionDeps): Promise<void> {
  const refreshToken = await deps.session.storedRefreshToken();
  if (!refreshToken) {
    deps.session.markSignedOut();
    return;
  }
  const userId = await deps.session.storedUserId();
  deps.session.setUserId(userId);
  try {
    await refreshAccessToken(deps);
  } catch (failure) {
    if (failure instanceof UnauthenticatedFailure) return; // already signed out
    logger.info('session restored offline; will refresh when back online');
    deps.session.markSignedInOffline(userId);
  }
}

/** Revokes the refresh token on the server (best effort: offline is fine) and clears everything on the device. */
export async function signOut(deps: SessionDeps): Promise<void> {
  const refreshToken = await deps.session.storedRefreshToken();
  if (refreshToken) {
    try {
      await deps.auth.revoke(refreshToken);
    } catch {
      // Offline or already invalid: the local sign-out still happens.
    }
  }
  await deps.session.end();
}
