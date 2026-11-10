import { useMutation } from '@tanstack/react-query';

import type { SignUpInput } from '../../domain/models/session';
import { signUp } from '../../domain/use-cases/sign-up';
import { authDeps } from '../session-controller';

/** Create an account and start a session (always remembered). */
export function useSignUp() {
  return useMutation({ mutationFn: (input: SignUpInput) => signUp(input, authDeps) });
}
