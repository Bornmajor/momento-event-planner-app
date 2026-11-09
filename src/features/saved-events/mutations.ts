import { useMutation } from '@tanstack/react-query';

import { savedEventsApi } from '@/api/endpoints';
import { queryClient, queryKeys } from '@/lib/query-client';

/**
 * Save works offline (spec §5.2): while offline the mutation is paused, kept in the persisted cache, and sent when
 * the connection returns, even after an app restart. That only works if the function is registered by key here,
 * because a paused mutation is restored from storage without its function. Imported once by the root layout.
 */
export const saveEventKey = ['save-event'] as const;

queryClient.setMutationDefaults(saveEventKey, {
  mutationFn: (eventId: string) => savedEventsApi.save(eventId),
  onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.savedEvents }),
});

export function useSaveEvent() {
  return useMutation<unknown, Error, string>({ mutationKey: saveEventKey });
}
