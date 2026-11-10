import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

jest.mock('@/api/endpoints', () => ({ authApi: { google: jest.fn() } }));
jest.mock('@/features/auth/session', () => ({ onSessionEnd: jest.fn(), startSession: jest.fn(async () => undefined) }));
jest.mock('@/features/saved-events/mutations', () => ({ queueLanguageUpdate: jest.fn() }));

// eslint-disable-next-line import/first -- mocks must be registered first
import { authApi } from '@/api/endpoints';
// eslint-disable-next-line import/first
import { ApiError } from '@/core/api/api-error';
// eslint-disable-next-line import/first
import { startSession } from '@/features/auth/session';
// eslint-disable-next-line import/first
import { queueLanguageUpdate } from '@/features/saved-events/mutations';
// eslint-disable-next-line import/first
import i18n from '@/core/i18n/i18n';
// eslint-disable-next-line import/first
import { queryClient, queryKeys } from '@/core/query/query-client';
// eslint-disable-next-line import/first
import { useGoogleSignIn } from '../use-google-sign-in';

const user = { id: 'u1', email: 'ada@example.com', firstName: 'Ada', lastName: 'L', language: 'en' };
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

afterEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
});

describe('Google sign-in', () => {
  it("exchanges the Google ID token, starts a remembered session, and sets a new account's language", async () => {
    await i18n.changeLanguage('fr');
    const response = { accessToken: 'a', refreshToken: 'r', user, isNewUser: true };
    (authApi.google as jest.Mock).mockResolvedValue(response);
    const { result } = await renderHook(() => useGoogleSignIn(), { wrapper });

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.mutateAsync();
    });

    expect(authApi.google).toHaveBeenCalledWith('mockIdToken'); // from the library's Jest mock
    expect(startSession).toHaveBeenCalledWith(response, true);
    expect(queryClient.getQueryData(queryKeys.me)).toEqual(user);
    expect(queueLanguageUpdate).toHaveBeenCalledWith('fr');
    expect(outcome).toEqual({ firstName: 'Ada', isNewUser: true });
    await i18n.changeLanguage('en');
  });

  it('explains when the email already has a password account, and forgets the Google account', async () => {
    (authApi.google as jest.Mock).mockRejectedValue(new ApiError(409, 'EMAIL_TAKEN', 'taken'));
    const signOut = jest.spyOn(GoogleSignin, 'signOut');
    const { result } = await renderHook(() => useGoogleSignIn(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toMatchObject({ messageKey: 'auth.googleEmailTaken' });
    });
    expect(startSession).not.toHaveBeenCalled();
    expect(signOut).toHaveBeenCalled();
  });
});
