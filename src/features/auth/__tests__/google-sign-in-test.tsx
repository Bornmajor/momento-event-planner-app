import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

jest.mock('@/features/auth/data/sources/auth-remote-source', () => ({ authRemoteSource: { google: jest.fn() } }));
jest.mock('@/features/auth/data/sources/token-local-source', () => ({
  tokenLocalSource: { saveSession: jest.fn(), clearSession: jest.fn(), isRemembered: () => true },
}));
jest.mock('@/features/profile/language-mutation', () => ({ queueLanguageUpdate: jest.fn() }));

// eslint-disable-next-line import/first -- mocks must be registered first
import { ApiError } from '@/core/api/api-error';
// eslint-disable-next-line import/first
import i18n from '@/core/i18n/i18n';
// eslint-disable-next-line import/first
import { queryClient, queryKeys } from '@/core/query/query-client';
// eslint-disable-next-line import/first
import { queueLanguageUpdate } from '@/features/profile/language-mutation';
// eslint-disable-next-line import/first
import { useSession } from '..';
// eslint-disable-next-line import/first
import { authRemoteSource } from '../data/sources/auth-remote-source';
// eslint-disable-next-line import/first
import { tokenLocalSource } from '../data/sources/token-local-source';
// eslint-disable-next-line import/first
import { EmailTakenFailure } from '../domain/failures';
// eslint-disable-next-line import/first
import { useGoogleSignIn } from '../presentation/hooks/use-google-sign-in';

const user = { id: 'u1', email: 'ada@example.com', firstName: 'Ada', lastName: 'L', language: 'en' };
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

afterEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  useSession.setState({ status: 'signedOut', accessToken: null, userId: null });
});

// Runs the real use case, repository and session store; only the API, device storage and Google SDK are fake.
describe('Google sign-in', () => {
  it("exchanges the Google ID token, starts a remembered session, and sets a new account's language", async () => {
    await i18n.changeLanguage('fr');
    (authRemoteSource.google as jest.Mock).mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user, isNewUser: true });
    const { result } = await renderHook(() => useGoogleSignIn(), { wrapper });

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.mutateAsync();
    });

    expect(authRemoteSource.google).toHaveBeenCalledWith('mockIdToken'); // from the library's Jest mock
    expect(tokenLocalSource.saveSession).toHaveBeenCalledWith('r', 'u1', true);
    expect(useSession.getState()).toMatchObject({ status: 'signedIn', accessToken: 'a', userId: 'u1' });
    expect(queryClient.getQueryData(queryKeys.me)).toMatchObject({ id: 'u1', firstName: 'Ada' });
    expect(queueLanguageUpdate).toHaveBeenCalledWith('fr');
    expect(outcome).toMatchObject({ user: { firstName: 'Ada' }, isNewUser: true });
    await i18n.changeLanguage('en');
  });

  it('turns EMAIL_TAKEN into EmailTakenFailure and forgets the Google account', async () => {
    (authRemoteSource.google as jest.Mock).mockRejectedValue(new ApiError(409, 'EMAIL_TAKEN', 'taken'));
    const signOut = jest.spyOn(GoogleSignin, 'signOut');
    const { result } = await renderHook(() => useGoogleSignIn(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toBeInstanceOf(EmailTakenFailure);
    });
    expect(tokenLocalSource.saveSession).not.toHaveBeenCalled();
    expect(signOut).toHaveBeenCalled();
  });
});
