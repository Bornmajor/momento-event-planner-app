import { useQuery } from '@tanstack/react-query';

import { meApi } from '@/api/endpoints';
import { cacheTimes, queryKeys } from '@/lib/query-client';

/** The signed-in user. Sign in / sign up seed this cache, so it's usually there without a request. */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => (await meApi.get()).user,
    ...cacheTimes.me,
  });
}
