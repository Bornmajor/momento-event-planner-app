import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { meApi, type UpdateMeRequest } from '@/api/endpoints';
import { signOut } from '@/features/auth';
import { useCalendarEntries } from '@/features/saved-events';
import { deleteCalendarEntry } from '@/core/calendar/device-calendar';
import { queryClient, queryKeys } from '@/core/query/query-client';

const name = z.string().trim().min(1, { message: 'validation.nameRequired' }).max(50, { message: 'validation.nameTooLong' });

/**
 * Profile form (spec §6). The phone is optional; when given it must be international, starting with + (the backend
 * stores it as E.164 and also accepts spaces and dashes). Empty clears it.
 */
export const profileSchema = z.object({
  firstName: name,
  lastName: name,
  phone: z
    .string()
    .trim()
    .refine((p) => p === '' || /^\+[\d\s()-]{7,20}$/.test(p), { message: 'validation.phone' }),
});
export type ProfileValues = z.input<typeof profileSchema>;

export function toUpdateRequest(values: ProfileValues): UpdateMeRequest {
  const parsed = profileSchema.parse(values);
  return { firstName: parsed.firstName, lastName: parsed.lastName, phone: parsed.phone === '' ? null : parsed.phone };
}

/** PATCH /me; the response replaces the cached user (spec §5.1). Needs a connection. */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (values: ProfileValues) => meApi.update(toUpdateRequest(values)),
    onSuccess: ({ user }) => queryClient.setQueryData(queryKeys.me, user),
  });
}

/**
 * Deletes the account (DELETE /me, cannot be undone), then removes the calendar entries this app created for the user
 * and signs out, which clears every cache on the phone. Needs a connection: if the server call fails nothing is
 * removed locally.
 */
export async function deleteAccount(userId: string) {
  await meApi.delete();
  const entries = useCalendarEntries.getState().byUser[userId] ?? {};
  await Promise.all(Object.values(entries).map((id) => deleteCalendarEntry(id)));
  useCalendarEntries.setState((state) => {
    const byUser = { ...state.byUser };
    delete byUser[userId];
    return { byUser };
  });
  await signOut();
}
