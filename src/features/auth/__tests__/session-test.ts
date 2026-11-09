import { ApiError, NetworkError } from '@/api/errors';

jest.mock('@/lib/secure-tokens', () => ({
  getRefreshToken: jest.fn(),
  getUserId: jest.fn(),
  saveSession: jest.fn(),
  saveRefreshToken: jest.fn(),
  clearSession: jest.fn(),
  isRemembered: jest.fn(() => true),
}));
jest.mock('@/api/endpoints', () => ({
  authApi: { refresh: jest.fn(), logout: jest.fn() },
}));

// eslint-disable-next-line import/first -- the mocks above must be registered before these imports
import { authApi } from '@/api/endpoints';
// eslint-disable-next-line import/first
import * as tokens from '@/lib/secure-tokens';
// eslint-disable-next-line import/first
import { restoreSession, useSession } from '../session';

const mocked = <T>(fn: T) => fn as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  useSession.setState({ status: 'restoring', accessToken: null, userId: null });
  mocked(tokens.getUserId).mockResolvedValue('user-1');
});

describe('restoreSession (spec §4)', () => {
  it('signs out when no refresh token is stored', async () => {
    mocked(tokens.getRefreshToken).mockResolvedValue(null);
    await restoreSession();
    expect(useSession.getState().status).toBe('signedOut');
    expect(authApi.refresh).not.toHaveBeenCalled();
  });

  it('signs in with a fresh access token when the refresh succeeds', async () => {
    mocked(tokens.getRefreshToken).mockResolvedValue('refresh-1');
    mocked(authApi.refresh).mockResolvedValue({ accessToken: 'access-2', refreshToken: 'refresh-2' });

    await restoreSession();

    expect(useSession.getState()).toMatchObject({ status: 'signedIn', accessToken: 'access-2', userId: 'user-1' });
    expect(tokens.saveRefreshToken).toHaveBeenCalledWith('refresh-2', true);
  });

  it('signs out and clears tokens when the server rejects the refresh token (401)', async () => {
    mocked(tokens.getRefreshToken).mockResolvedValue('refresh-1');
    mocked(authApi.refresh).mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token'));

    await restoreSession();

    expect(useSession.getState().status).toBe('signedOut');
    expect(tokens.clearSession).toHaveBeenCalled();
  });

  it('stays signed in, offline, when the server cannot be reached', async () => {
    mocked(tokens.getRefreshToken).mockResolvedValue('refresh-1');
    mocked(authApi.refresh).mockRejectedValue(new NetworkError('offline'));

    await restoreSession();

    expect(useSession.getState()).toMatchObject({ status: 'signedIn', accessToken: null, userId: 'user-1' });
    expect(tokens.clearSession).not.toHaveBeenCalled();
  });
});
