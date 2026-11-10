import type { Language, User } from '@/features/auth';

import type { ProfileChanges } from './models/profile';

/** The signed-in account on the server. Throws ValidationFailure or a shared failure. */
export interface ProfileRepository {
  me(): Promise<User>;
  update(changes: ProfileChanges): Promise<User>;
  updateLanguage(language: Language): Promise<User>;
  /** Deletes the account. Cannot be undone. */
  delete(): Promise<void>;
}

export interface DeleteAccountDeps {
  profile: ProfileRepository;
  /** The calendar entries this phone created for the user (event id → entry id), and forgetting them. */
  calendarEntries: { all(userId: string): string[]; forgetAll(userId: string): void };
  deleteCalendarEntry(calendarEventId: string): Promise<void>;
  signOut(): Promise<void>;
}
