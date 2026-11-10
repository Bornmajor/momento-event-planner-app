import { useMutation } from '@tanstack/react-query';

import { personalizeRepository } from '../../data/personalize-repository';
import type { Personalization, PersonalizeOptions } from '../../domain/models/personalization';

/**
 * One AI personalization of an event (no use case: it's a single repository call). `textLanguage` is the language
 * the result is written in, passed through so the screen can format the date in it.
 */
export function usePersonalize(eventId: string, onSuccess: (result: Personalization, textLanguage: string) => void, onError: (failure: Error) => void) {
  return useMutation({
    mutationFn: ({ options }: { options: PersonalizeOptions; textLanguage: string }) =>
      personalizeRepository.personalize(eventId, options),
    onSuccess: (result, { textLanguage }) => onSuccess(result, textLanguage),
    onError,
  });
}
