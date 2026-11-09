import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/api/endpoints';
import { ApiError, errorMessageKey } from '@/api/errors';
import { queueLanguageUpdate } from '@/features/saved-events/mutations';
import i18n, { isAppLanguage } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import { queryClient, queryKeys } from '@/lib/query-client';

import { onSessionEnd, startSession } from './session';

/** Google Cloud "Web application" client ID. The ID token's audience is this ID, which the backend checks. */
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID; // dot notation is required for Expo to inline it

/** Google sign-in is shown only when a client ID is configured. */
export const googleSignInEnabled = Boolean(webClientId);

let configured = false;
function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId });
  configured = true;
}

// Forget the Google account on sign-out, so the next "Continue with Google" shows the account picker again.
onSessionEnd(async () => {
  if (!googleSignInEnabled) return;
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch (error) {
    logger.warn('google sign-out failed', error);
  }
});

/** Thrown for a Google-side failure; `messageKey` is the translation to show. */
export class GoogleSignInError extends Error {
  constructor(readonly messageKey: string) {
    super(messageKey);
    this.name = 'GoogleSignInError';
  }
}

export type GoogleSignInResult = { firstName: string; isNewUser: boolean } | null;

/**
 * Picks a Google account on the device, exchanges its ID token at `/auth/google`, then starts the session (always
 * remembered). Resolves to null when the user closes the account picker.
 */
async function signInWithGoogle(): Promise<GoogleSignInResult> {
  ensureConfigured();
  let idToken: string | null;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null; // cancelled
    idToken = response.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.IN_PROGRESS) return null;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new GoogleSignInError('auth.googleNoPlayServices');
      // DEVELOPER_ERROR (10) usually means the Android client's package name or SHA-1 doesn't match this build.
      logger.warn('google sign-in failed', error.code, error.message);
    } else {
      logger.warn('google sign-in failed', error);
    }
    throw new GoogleSignInError('auth.googleFailed');
  }
  if (!idToken) throw new GoogleSignInError('auth.googleFailed');

  let result: Awaited<ReturnType<typeof authApi.google>>;
  try {
    result = await authApi.google(idToken);
  } catch (error) {
    await GoogleSignin.signOut().catch(() => undefined); // let them pick another account next time
    if (error instanceof ApiError && error.code === 'EMAIL_TAKEN') throw new GoogleSignInError('auth.googleEmailTaken');
    throw new GoogleSignInError(errorMessageKey(error));
  }

  await startSession(result, true);
  queryClient.setQueryData(queryKeys.me, result.user);
  // Like email sign-up: a new account starts in English, so use the app's language for AI personalization.
  if (result.isNewUser && isAppLanguage(i18n.language) && i18n.language !== result.user.language) {
    queueLanguageUpdate(i18n.language);
  }
  return { firstName: result.user.firstName, isNewUser: result.isNewUser };
}

export function useGoogleSignIn() {
  return useMutation({ mutationFn: signInWithGoogle });
}
