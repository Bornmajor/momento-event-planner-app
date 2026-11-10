import * as SecureStore from 'expo-secure-store';

/**
 * The refresh token and the signed-in user's id, kept in SecureStore (Android Keystore / iOS Keychain).
 * With "Remember me" off they stay in memory only, so the session ends when the app closes (spec §6).
 * The access token is never stored; it lives in the session store's memory.
 */
const REFRESH_KEY = 'momento.refresh';
const USER_KEY = 'momento.user';

let memory: { refreshToken: string; userId: string } | null = null;
let remembered = true;

export function isRemembered() {
  return remembered;
}

export async function saveSession(refreshToken: string, userId: string, remember: boolean) {
  remembered = remember;
  if (remember) {
    memory = null;
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    await SecureStore.setItemAsync(USER_KEY, userId);
  } else {
    memory = { refreshToken, userId };
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}

/** Replaces the refresh token after a rotation, keeping the same "remember" choice. */
export async function saveRefreshToken(refreshToken: string, remember: boolean) {
  if (remember) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  else if (memory) memory.refreshToken = refreshToken;
}

export async function getRefreshToken(): Promise<string | null> {
  return memory?.refreshToken ?? (await SecureStore.getItemAsync(REFRESH_KEY));
}

export async function getUserId(): Promise<string | null> {
  return memory?.userId ?? (await SecureStore.getItemAsync(USER_KEY));
}

export async function clearSession() {
  memory = null;
  remembered = true;
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

/** The device's session storage, as one object for the session gateway (and easy to mock in tests). */
export const tokenLocalSource = { isRemembered, saveSession, saveRefreshToken, getRefreshToken, getUserId, clearSession };
