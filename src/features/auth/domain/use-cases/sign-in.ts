import type { Credentials } from '../models/session';
import type { User } from '../models/user';
import type { AuthDeps } from '../ports';

/** Signs in with email and password. Throws InvalidCredentialsFailure, RateLimitedFailure or a shared failure. */
export async function signIn(credentials: Credentials, remember: boolean, deps: Pick<AuthDeps, 'auth' | 'session'>): Promise<User> {
  const session = await deps.auth.signIn(credentials);
  await deps.session.start(session, remember);
  return session.user;
}
