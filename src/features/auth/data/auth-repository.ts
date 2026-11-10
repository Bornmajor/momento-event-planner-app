import { isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';

import { ApiError } from '@/core/api/api-error';
import { AppFailure, mapApiError } from '@/core/failures';
import { logger } from '@/core/logger';

import { EmailTakenFailure, GoogleSignInFailure, InvalidCredentialsFailure } from '../domain/failures';
import type { AuthRepository } from '../domain/ports';
import { toAuthSession, toGoogleAuthSession } from './mappers/user.mapper';
import { authRemoteSource } from './sources/auth-remote-source';
import { googleAccountSource } from './sources/google-account-source';

/** Raw error → domain failure: auth's own codes first, then the shared ones (core/failures). */
function toFailure(error: unknown): AppFailure {
  if (error instanceof ApiError) {
    if (error.code === 'EMAIL_TAKEN') return new EmailTakenFailure();
    if (error.code === 'INVALID_CREDENTIALS') return new InvalidCredentialsFailure();
  }
  return mapApiError(error);
}

/** Runs a source call, turning anything it throws into a domain failure. */
async function attempt<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toFailure(error);
  }
}

/** Auth data: maps DTOs to domain models and raw errors to failures (spec §12.1). */
export const authRepository: AuthRepository = {
  register: (input) =>
    attempt(async () =>
      toAuthSession(
        await authRemoteSource.register({
          email: input.email,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
        }),
      ),
    ),

  signIn: (credentials) => attempt(async () => toAuthSession(await authRemoteSource.login(credentials))),

  signInWithGoogleToken: (idToken) => attempt(async () => toGoogleAuthSession(await authRemoteSource.google(idToken))),

  refresh: (refreshToken) => attempt(() => authRemoteSource.refresh(refreshToken)),

  revoke: (refreshToken) => attempt(() => authRemoteSource.logout(refreshToken)),

  async pickGoogleAccount() {
    try {
      const result = await googleAccountSource.pickAccount();
      if (result.cancelled) return null;
      if (!result.idToken) throw new GoogleSignInFailure('failed');
      return result.idToken;
    } catch (error) {
      if (error instanceof AppFailure) throw error;
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.IN_PROGRESS) return null; // a picker is already open
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new GoogleSignInFailure('noPlayServices');
        // DEVELOPER_ERROR (10) usually means the Android client's package name or SHA-1 doesn't match this build.
        logger.warn('google sign-in failed', error.code, error.message);
      } else {
        logger.warn('google sign-in failed', error);
      }
      throw new GoogleSignInFailure('failed');
    }
  },

  async forgetGoogleAccount() {
    try {
      await googleAccountSource.signOut();
    } catch (error) {
      logger.warn('google sign-out failed', error);
    }
  },
};
