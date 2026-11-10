import { deleteCalendarEntry } from '@/core/calendar/device-calendar';
import { signOut } from '@/features/auth';

import { calendarEntriesForAccount } from '../data/calendar-entries';
import { profileRepository } from '../data/profile-repository';
import { deleteAccount as deleteAccountUseCase } from '../domain/use-cases/delete-account';

/** Deletes the account, this user's calendar entries made by Momento, then signs out (delete-account use case). */
export const deleteAccount = (userId: string) =>
  deleteAccountUseCase(userId, {
    profile: profileRepository,
    calendarEntries: calendarEntriesForAccount,
    deleteCalendarEntry,
    signOut,
  });
