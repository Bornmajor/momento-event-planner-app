import { useQuery } from '@tanstack/react-query';

import { cacheTimes, queryKeys } from '@/core/query/query-client';

import { profileRepository } from '../../data/profile-repository';

/** The signed-in user. Sign in / sign up seed this cache, so it's usually there without a request. */
export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: () => profileRepository.me(), ...cacheTimes.me });
}
