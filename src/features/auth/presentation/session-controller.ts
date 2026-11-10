import { setAuthHooks } from '@/core/api/http';
import i18n, { isAppLanguage } from '@/core/i18n/i18n';

import { authRepository } from '../data/auth-repository';
import { googleSignInEnabled } from '../data/sources/google-account-source';
import type { AuthDeps, Preferences } from '../domain/ports';
import * as sessionUseCases from '../domain/use-cases/session';
import { onSessionEnd, sessionGateway, useSession } from './state/session-store';

/** Saving the account language belongs to profile; the root layout connects it (configureAuth), so auth never
 * imports profile and the two features don't depend on each other. */
let saveAccountLanguage: Preferences['queueLanguageUpdate'] = () => undefined;

/** Connects what auth needs from other features. Called once by the root layout. */
export function configureAuth(options: { queueLanguageUpdate: Preferences['queueLanguageUpdate'] }) {
  saveAccountLanguage = options.queueLanguageUpdate;
}

/**
 * Wires the auth use cases to their real dependencies (the composition point for this feature) and exposes the
 * session actions the rest of the app uses.
 */
export const authDeps: AuthDeps = {
  auth: authRepository,
  session: sessionGateway,
  preferences: {
    appLanguage: () => (isAppLanguage(i18n.language) ? i18n.language : null),
    queueLanguageUpdate: (language) => saveAccountLanguage(language),
  },
};

/** Start-up restore: signed in, signed out, or signed in offline (docs/authentication.md). */
export const restoreSession = () => sessionUseCases.restoreSession(authDeps);

/** Revokes the refresh token (best effort) and clears everything on the device. */
export const signOut = () => sessionUseCases.signOut(authDeps);

// The HTTP client reads the access token and asks for a refresh on a 401 through these hooks.
setAuthHooks({
  getAccessToken: () => useSession.getState().accessToken,
  refreshAccessToken: () => sessionUseCases.refreshAccessToken(authDeps),
});

// Forget the Google account on sign-out, so the next "Continue with Google" shows the account picker again.
onSessionEnd(async () => {
  if (googleSignInEnabled) await authRepository.forgetGoogleAccount();
});
