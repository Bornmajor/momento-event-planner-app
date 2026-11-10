import { useMutation } from '@tanstack/react-query';

import { queryClient, queryKeys } from '@/core/query/query-client';
import type { Language } from '@/features/auth';

import { profileRepository } from '../data/profile-repository';

/**
 * The account's language is the default for AI personalization (intent §4.5). Saving it is a mutation that pauses
 * while offline and runs when back online, even after a restart, so it is registered by key here. This module is
 * imported by the root layout before the cache is restored.
 */
export const updateLanguageKey = ['update-language'] as const;

queryClient.setMutationDefaults(updateLanguageKey, {
  mutationFn: (language: Language) => profileRepository.updateLanguage(language),
  onSuccess: (user: unknown) => queryClient.setQueryData(queryKeys.me, user),
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
