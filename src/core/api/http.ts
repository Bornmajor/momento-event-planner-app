import { createApiClient, type AuthHooks } from './http-client';

/**
 * The app's API client. The session module plugs in how to read and refresh tokens (setAuthHooks), so this file
 * doesn't import the session (no import cycle).
 */
let hooks: AuthHooks = {
  getAccessToken: () => null,
  refreshAccessToken: async () => {
    throw new Error('Auth hooks not configured');
  },
};

export function setAuthHooks(next: AuthHooks) {
  hooks = next;
}

const baseUrl = process.env.EXPO_PUBLIC_API_URL; // dot notation is required for Expo to inline it

if (!baseUrl) {
  throw new Error('EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env and set it.');
}

export const api = createApiClient({
  baseUrl,
  auth: {
    getAccessToken: () => hooks.getAccessToken(),
    refreshAccessToken: () => hooks.refreshAccessToken(),
  },
});
