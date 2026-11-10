import { ApiError, NetworkError } from '@/core/api/api-error';

jest.mock('@/features/auth/data/sources/token-local-source', () => ({
  tokenLocalSource: {
    getRefreshToken: jest.fn(),
    getUserId: jest.fn(),
    saveSession: jest.fn(),
    saveRefreshToken: jest.fn(),
    clearSession: jest.fn(),
    isRemembered: jest.fn(() => true),
  },
}));
jest.mock('@/features/auth/data/sources/auth-remote-source', () => ({
  authRemoteSource: { refresh: jest.fn(), logout: jest.fn() },
}));

// eslint-disable-next-line import/first -- the mocks above must be registered before these imports
import { restoreSession, useSession } from '..';
// eslint-disable-next-line import/first
import { authRemoteSource } from '../data/sources/auth-remote-source';
// eslint-disable-next-line import/first
import { tokenLocalSource as tokens } from '../data/sources/token-local-source';

const mocked = <T>(fn: T) => fn as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  useSession.setState({ status: 'restoring', accessToken: null, userId: null });
  mocked(tokens.getUserId).mockResolvedValue('user-1');
});

// Runs the real use case, repository (error → failure mapping) and session store; only the sources are fake.
describe('restoreSession', () => {
  it('signs out when no refresh token is stored', async () => {
    mocked(tokens.getRefreshToken).mockResolvedValue(null);
    await restoreSession();
    expect(useSession.getState().status).toBe('signedOut');
    expect(authRemoteSource.refresh).not.toHaveBeenCalled();
  });

  it('signs in with a fresh access token when the refresh succeeds', async () => {
    mocked(tokens.getRefreshToken).mockResolvedValue('refresh-1');
    mocked(authRemoteSource.refresh).mockResolvedValue({ accessToken: 'access-2', refreshToken: 'refresh-2' });

    await restoreSession();

    expect(useSession.getState()).toMatchObject({ status: 'signedIn', accessToken: 'access-2', userId: 'user-1' });
    expect(tokens.saveRefreshToken).toHaveBeenCalledWith('refresh-2', true);
  });

  it('signs out and clears tokens when the server rejects the refresh token (401)', async () => {
    mocked(tokens.getRefreshToken).mockResolvedValue('refresh-1');
    mocked(authRemoteSource.refresh).mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token'));

    await restoreSession();

    expect(useSession.getState().status).toBe('signedOut');
    expect(tokens.clearSession).toHaveBeenCalled();
  });

  it('stays signed in, offline, when the server cannot be reached', async () => {
    mocked(tokens.getRefreshToken).mockResolvedValue('refresh-1');
    mocked(authRemoteSource.refresh).mockRejectedValue(new NetworkError('offline'));

    await restoreSession();

    expect(useSession.getState()).toMatchObject({ status: 'signedIn', accessToken: null, userId: 'user-1' });
    expect(tokens.clearSession).not.toHaveBeenCalled();
  });
});
