import type { User } from '../models/user';
import type { AuthDeps } from '../ports';
import { syncNewAccountLanguage } from './sign-up';

export type GoogleSignInResult = { user: User; isNewUser: boolean } | null;

/**
 * Picks a Google account on the device and exchanges its ID token for a Momento session (always kept).
 * Resolves to null when the user closes the picker. If our API refuses, the Google account is forgotten so the
 * picker shows again next time. Throws GoogleSignInFailure, EmailTakenFailure (the email has an account that
 * can't be linked) or a shared failure.
 */
export async function signInWithGoogle(deps: AuthDeps): Promise<GoogleSignInResult> {
  const idToken = await deps.auth.pickGoogleAccount();
  if (!idToken) return null;

  let session;
  try {
    session = await deps.auth.signInWithGoogleToken(idToken);
  } catch (failure) {
    await deps.auth.forgetGoogleAccount();
    throw failure;
  }

  await deps.session.start(session, true);
  if (session.isNewUser) syncNewAccountLanguage(session.user, deps.preferences);
  return { user: session.user, isNewUser: session.isNewUser };
}
