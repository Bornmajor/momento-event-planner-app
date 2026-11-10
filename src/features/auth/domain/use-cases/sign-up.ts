import type { SignUpInput } from '../models/session';
import type { Language, User } from '../models/user';
import type { AuthDeps, Preferences } from '../ports';

/** New accounts start in English; switch them to the app's language (used for AI personalization, intent §4.5). */
export function syncNewAccountLanguage(user: User, preferences: Preferences) {
  const language: Language | null = preferences.appLanguage();
  if (language && language !== user.language) preferences.queueLanguageUpdate(language);
}

/**
 * Creates the account, then starts a session. Sign-up has no "Remember me", so the session is always kept.
 * Throws EmailTakenFailure, ValidationFailure or a shared failure.
 */
export async function signUp(input: SignUpInput, deps: AuthDeps): Promise<User> {
  const session = await deps.auth.register(input);
  await deps.session.start(session, true);
  syncNewAccountLanguage(session.user, deps.preferences);
  return session.user;
}
