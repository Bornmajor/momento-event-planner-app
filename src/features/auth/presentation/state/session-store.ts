import { create } from 'zustand';

import { logger } from '@/core/logger';
import { clearQueryCache, queryClient, queryKeys } from '@/core/query/query-client';

import { tokenLocalSource } from '../../data/sources/token-local-source';
import type { SessionGateway } from '../../domain/ports';

export type SessionStatus = 'restoring' | 'signedIn' | 'signedOut';

interface SessionState {
  status: SessionStatus;
  /** In memory only. Null while signed out, or when signed in offline before the first successful refresh. */
  accessToken: string | null;
  userId: string | null;
}

/** The session the screens and route guards follow. */
export const useSession = create<SessionState>(() => ({ status: 'restoring', accessToken: null, userId: null }));

type Listener = () => void | Promise<void>;
const sessionEndListeners: Listener[] = [];

/** Runs when the session ends (sign-out or a rejected refresh token), e.g. to clear cached data. */
export function onSessionEnd(listener: Listener) {
  sessionEndListeners.push(listener);
}

// Signing out clears cached server data (core can't import features, so the feature registers it).
onSessionEnd(clearQueryCache);

const signedOut = { status: 'signedOut', accessToken: null, userId: null } as const;

/** The session as the use cases see it (domain/ports.ts): device tokens plus the in-memory state above. */
export const sessionGateway: SessionGateway = {
  async start(session, remember) {
    await tokenLocalSource.saveSession(session.refreshToken, session.user.id, remember);
    queryClient.setQueryData(queryKeys.me, session.user); // the user is in the response; no extra /me call
    useSession.setState({ status: 'signedIn', accessToken: session.accessToken, userId: session.user.id });
  },

  async end() {
    await tokenLocalSource.clearSession();
    useSession.setState(signedOut);
    for (const listener of sessionEndListeners) {
      try {
        await listener();
      } catch (error) {
        logger.warn('session end listener failed', error);
      }
    }
  },

  storedRefreshToken: () => tokenLocalSource.getRefreshToken(),
  storedUserId: () => tokenLocalSource.getUserId(),
  setUserId: (userId) => useSession.setState({ userId }),

  async rotate(pair) {
    await tokenLocalSource.saveRefreshToken(pair.refreshToken, tokenLocalSource.isRemembered());
    useSession.setState({ status: 'signedIn', accessToken: pair.accessToken });
  },

  markSignedOut: () => useSession.setState(signedOut),
  markSignedInOffline: (userId) => useSession.setState({ status: 'signedIn', accessToken: null, userId }),
};
