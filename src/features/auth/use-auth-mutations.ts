import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/api/endpoints';

import type { SignInValues, SignUpValues } from './schemas';
import { startSession } from './session';

/** Sign in with email and password, then start the session (the route guard switches screens). */
export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password, remember }: SignInValues) => {
      const result = await authApi.login({ email, password });
      await startSession(result, remember);
      return result.user;
    },
  });
}

/** Create an account, then start the session. Always remembered (no checkbox on Sign Up). */
export function useSignUp() {
  return useMutation({
    mutationFn: async (values: SignUpValues) => {
      const result = await authApi.register(values);
      await startSession(result, true);
      return result.user;
    },
  });
}
