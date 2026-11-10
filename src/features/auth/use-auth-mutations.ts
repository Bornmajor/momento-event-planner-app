import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/api/endpoints';
import { queueLanguageUpdate } from '@/features/saved-events/mutations';
import i18n, { isAppLanguage } from '@/core/i18n/i18n';
import { queryClient, queryKeys } from '@/core/query/query-client';

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
      // New accounts start in English; use the app's language for AI personalization instead (intent §4.5).
      if (isAppLanguage(i18n.language) && i18n.language !== result.user.language) queueLanguageUpdate(i18n.language);
      return result.user;
    },
  });
}
