import { useMutation } from '@tanstack/react-query';

import type { Credentials } from '../../domain/models/session';
import { signIn } from '../../domain/use-cases/sign-in';
import { authDeps } from '../session-controller';

/** Sign in with email and password; the session then flips the route guard to the signed-in area. */
export function useSignIn() {
  return useMutation({
    mutationFn: ({ remember, ...credentials }: Credentials & { remember: boolean }) =>
      signIn(credentials, remember, authDeps),
  });
}
