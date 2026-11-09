import { createApiClient, type AuthHooks } from '../client';
import { ApiError, NetworkError } from '../errors';

interface FakeResponse {
  status: number;
  body?: unknown;
}

/** A fetch stand-in: returns queued responses in order and records each call. */
function fakeFetch(responses: (FakeResponse | Error)[]) {
  const queue = [...responses];
  return jest.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => {
    const next = queue.shift();
    if (!next) throw new Error('no more fake responses');
    if (next instanceof Error) throw next;
    return {
      status: next.status,
      ok: next.status >= 200 && next.status < 300,
      text: async () => (next.body === undefined ? '' : JSON.stringify(next.body)),
    } as unknown as Response;
  });
}

function authHooks(overrides: Partial<AuthHooks> = {}): AuthHooks {
  return {
    getAccessToken: () => 'old-token',
    refreshAccessToken: jest.fn(async () => 'new-token'),
    ...overrides,
  };
}

const headersOf = (call: unknown[]) => (call[1] as RequestInit).headers as Record<string, string>;
const unauthorized = { status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } } };

describe('api client', () => {
  it('sends JSON with the Bearer token and the ngrok header', async () => {
    const fetchFn = fakeFetch([{ status: 200, body: { ok: true } }]);
    const api = createApiClient({ baseUrl: 'https://api.test/api/v1', fetchFn, auth: authHooks() });

    await expect(api.post('/me/saved-events', { eventId: 'e1' })).resolves.toEqual({ ok: true });

    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/v1/me/saved-events');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ eventId: 'e1' }));
    expect(headersOf(fetchFn.mock.calls[0]!)).toMatchObject({
      Authorization: 'Bearer old-token',
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    });
  });

  it('omits the token for public calls and builds query strings', async () => {
    const fetchFn = fakeFetch([{ status: 200, body: [] }]);
    const api = createApiClient({ baseUrl: 'https://api.test/api/v1', fetchFn, auth: authHooks() });

    await api.get('/events', { query: { q: 'jazz', category: undefined, page: 0 }, auth: false });

    expect(fetchFn.mock.calls[0]![0]).toBe('https://api.test/api/v1/events?q=jazz&page=0');
    expect(headersOf(fetchFn.mock.calls[0]!).Authorization).toBeUndefined();
  });

  it('refreshes once for two parallel 401s and retries both with the new token', async () => {
    const fetchFn = fakeFetch([unauthorized, unauthorized, { status: 200, body: 'a' }, { status: 200, body: 'b' }]);
    const hooks = authHooks();
    const api = createApiClient({ baseUrl: 'https://api.test', fetchFn, auth: hooks });

    await expect(Promise.all([api.get('/a'), api.get('/b')])).resolves.toEqual(['a', 'b']);

    expect(hooks.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(headersOf(fetchFn.mock.calls[2]!).Authorization).toBe('Bearer new-token');
    expect(headersOf(fetchFn.mock.calls[3]!).Authorization).toBe('Bearer new-token');
  });

  it('rejects with UNAUTHENTICATED when the refresh itself is rejected', async () => {
    const fetchFn = fakeFetch([unauthorized]);
    const refreshAccessToken = jest.fn(async () => {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token');
    });
    const api = createApiClient({ baseUrl: 'https://api.test', fetchFn, auth: authHooks({ refreshAccessToken }) });

    await expect(api.get('/me')).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  it('reports a NetworkError (not a sign-out) when the refresh cannot reach the server', async () => {
    const fetchFn = fakeFetch([unauthorized]);
    const refreshAccessToken = jest.fn(async () => {
      throw new NetworkError('offline');
    });
    const api = createApiClient({ baseUrl: 'https://api.test', fetchFn, auth: authHooks({ refreshAccessToken }) });

    await expect(api.get('/me')).rejects.toBeInstanceOf(NetworkError);
  });

  it('maps API error bodies to ApiError and failed requests to NetworkError', async () => {
    const fetchFn = fakeFetch([
      {
        status: 409,
        body: { error: { code: 'EMAIL_TAKEN', message: 'Taken', details: [{ path: 'email' }] } },
      },
      new TypeError('Network request failed'),
    ]);
    const api = createApiClient({ baseUrl: 'https://api.test', fetchFn, auth: authHooks() });

    await expect(api.post('/auth/register', {}, { auth: false })).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
      details: [{ path: 'email' }],
    });
    await expect(api.get('/events')).rejects.toBeInstanceOf(NetworkError);
  });

  it('returns undefined for 204 No Content', async () => {
    const api = createApiClient({ baseUrl: 'https://api.test', fetchFn: fakeFetch([{ status: 204 }]), auth: authHooks() });
    await expect(api.delete('/me')).resolves.toBeUndefined();
  });
});
