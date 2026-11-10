import { mapApiError } from '@/core/failures';
import { toUser } from '@/features/auth';

import type { ProfileRepository } from '../domain/ports';
import { meRemoteSource } from './sources/me-remote-source';

async function attempt<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw mapApiError(error);
  }
}

/** The account: maps the API user to the domain user (auth's mapper) and raw errors to failures. */
export const profileRepository: ProfileRepository = {
  me: () => attempt(async () => toUser((await meRemoteSource.get()).user)),
  update: (changes) => attempt(async () => toUser((await meRemoteSource.update(changes)).user)),
  updateLanguage: (language) => attempt(async () => toUser((await meRemoteSource.update({ language })).user)),
  delete: () => attempt(() => meRemoteSource.delete()),
};
