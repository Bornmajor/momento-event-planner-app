import { useMutation } from '@tanstack/react-query';

import { signInWithGoogle } from '../../domain/use-cases/sign-in-with-google';
import { authDeps } from '../session-controller';

export { googleSignInEnabled } from '../../data/sources/google-account-source';

/** "Continue with Google": resolves to null when the user closes the account picker. */
export function useGoogleSignIn() {
  return useMutation({ mutationFn: () => signInWithGoogle(authDeps) });
}
