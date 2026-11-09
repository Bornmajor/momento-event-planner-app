import { create } from 'zustand';

import { authApi, type AuthResponse } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import { setAuthHooks } from '@/api/http';
import { logger } from '@/lib/logger';
import * as tokens from '@/lib/secure-tokens';

export type SessionStatus = 'restoring' | 'signedIn' | 'signedOut';

interface SessionState {
  status: SessionStatus;
  /** In memory only. Null while signed out, or when signed in offline before the first successful refresh. */
  accessToken: string | null;
  userId: string | null;
}

export const useSession = create<SessionState>(() => ({ status: 'restoring', accessToken: null, userId: null }));

type Listener = () => void | Promise<void>;
const sessionEndListeners: Listener[] = [];

/** Runs when the session ends (sign-out or a rejected refresh token), e.g. to clear cached data. */
export function onSessionEnd(listener: Listener) {
  sessionEndListeners.push(listener);
}

async function endSession() {
  await tokens.clearSession();
  useSession.setState({ status: 'signedOut', accessToken: null, userId: null });
  for (const listener of sessionEndListeners) {
    try {
      await listener();
    } catch (error) {
      logger.warn('session end listener failed', error);
    }
  }
}

/** Starts a session from a sign-in/sign-up response. */
export async function startSession(result: AuthResponse, remember: boolean) {
  await tokens.saveSession(result.refreshToken, result.user.id, remember);
  useSession.setState({ status: 'signedIn', accessToken: result.accessToken, userId: result.user.id });
}

/**
 * Exchanges the refresh token for a new pair. Only a 401 ends the session; network errors and 5xx keep it
 * (spec §4–5), so the app keeps working offline and retries later.
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await tokens.getRefreshToken();
  if (!refreshToken) {
    await endSession();
    throw new ApiError(401, 'UNAUTHENTICATED', 'No session');
  }
  try {
    const pair = await authApi.refresh(refreshToken);
    await tokens.saveRefreshToken(pair.refreshToken, tokens.isRemembered());
    useSession.setState({ status: 'signedIn', accessToken: pair.accessToken });
    return pair.accessToken;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await endSession();
    throw error;
  }
}

/**
 * Start-up restore (spec §4): no stored token → signed out; refresh OK → signed in; refresh 401 → signed out;
 * no connection (or a server error) → signed in offline, using the cached data.
 */
export async function restoreSession() {
  const refreshToken = await tokens.getRefreshToken();
  if (!refreshToken) {
    useSession.setState({ status: 'signedOut', accessToken: null, userId: null });
    return;
  }
  const userId = await tokens.getUserId();
  useSession.setState({ userId });
  try {
    await refreshAccessToken();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return; // already signed out
    logger.info('session restored offline; will refresh when back online');
    useSession.setState({ status: 'signedIn', accessToken: null, userId });
  }
}

/** Signs out: revokes the refresh token on the server (best effort) and clears everything on the device. */
export async function signOut() {
  const refreshToken = await tokens.getRefreshToken();
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Offline or already invalid: the local sign-out still happens.
    }
  }
  await endSession();
}

setAuthHooks({
  getAccessToken: () => useSession.getState().accessToken,
  refreshAccessToken,
});
