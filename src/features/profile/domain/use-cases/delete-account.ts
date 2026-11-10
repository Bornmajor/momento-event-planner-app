import type { DeleteAccountDeps } from '../ports';

/**
 * Deletes the account (cannot be undone), then removes the calendar entries this app created for the user and signs
 * out, which clears every cache on the phone. Needs a connection: if the server call fails, nothing is removed.
 */
export async function deleteAccount(userId: string, deps: DeleteAccountDeps): Promise<void> {
  await deps.profile.delete();
  await Promise.all(deps.calendarEntries.all(userId).map((id) => deps.deleteCalendarEntry(id)));
  deps.calendarEntries.forgetAll(userId);
  await deps.signOut();
}
