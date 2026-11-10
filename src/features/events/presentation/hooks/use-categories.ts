import { useQuery } from '@tanstack/react-query';

import { cacheTimes, queryKeys } from '@/core/query/query-client';

import { eventsRepository } from '../../data/events-repository';

/** The fixed category list (cached for the app's lifetime). */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: ({ signal }) => eventsRepository.categories(signal),
    ...cacheTimes.categories,
  });
}
