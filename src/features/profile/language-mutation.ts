import { useMutation } from '@tanstack/react-query';

import { meApi, type Language } from '@/api/endpoints';
import { queryClient, queryKeys } from '@/core/query/query-client';

/**
 * The account's language is the default for AI personalization (intent §4.5). Saving it is a mutation that pauses
 * while offline and runs when back online, even after a restart, so it is registered by key here. This module is
 * imported by the root layout before the cache is restored.
 */
export const updateLanguageKey = ['update-language'] as const;

queryClient.setMutationDefaults(updateLanguageKey, {
  mutationFn: (language: Language) => meApi.update({ language }),
  onSuccess: (result: unknown) => queryClient.setQueryData(queryKeys.me, (result as { user: unknown }).user),
});

export function useUpdateLanguage() {
  return useMutation<unknown, Error, Language>({ mutationKey: updateLanguageKey });
}

/** For code outside React (e.g. right after sign-up). */
export function queueLanguageUpdate(language: Language) {
  void queryClient
    .getMutationCache()
    .build(queryClient, { mutationKey: updateLanguageKey })
    .execute(language)
    .catch(() => undefined);
}
