import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/api/endpoints';
import { queryClient, queryKeys } from '@/lib/query-client';

import type { SignInValues, SignUpValues } from './schemas';
import { startSession } from './session';

/** Sign in with email and password, then start the session (the route guard switches screens). */
export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password, remember }: SignInValues) => {
      const result = await authApi.login({ email, password });
      await startSession(result, remember);
      queryClient.setQueryData(queryKeys.me, result.user); // the user is in the response; no extra /me call
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
      queryClient.setQueryData(queryKeys.me, result.user);
      return result.user;
    },
  });
}
