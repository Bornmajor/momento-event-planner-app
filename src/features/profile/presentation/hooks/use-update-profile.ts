import { useMutation } from '@tanstack/react-query';

import { queryClient, queryKeys } from '@/core/query/query-client';

import { profileRepository } from '../../data/profile-repository';
import { toProfileChanges, type ProfileValues } from '../schemas';

/** PATCH /me; the response replaces the cached user (spec §5.1). Needs a connection. */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (values: ProfileValues) => profileRepository.update(toProfileChanges(values)),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
}
