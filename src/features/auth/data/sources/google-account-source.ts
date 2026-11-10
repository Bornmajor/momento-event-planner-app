import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

/** Google Cloud "Web application" client ID. The ID token's audience is this ID, which the backend checks. */
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID; // dot notation is required for Expo to inline it

/** Google sign-in is shown only when a client ID is configured. */
export const googleSignInEnabled = Boolean(webClientId);

let configured = false;
function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId });
  configured = true;
}

/** The Google Sign-In SDK on the device. Throws the SDK's own errors. */
export const googleAccountSource = {
  /** Opens the account picker. `cancelled` when the user closes it; `idToken` can be null if Google sends none. */
  async pickAccount(): Promise<{ cancelled: true } | { cancelled: false; idToken: string | null }> {
    ensureConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return { cancelled: true };
    return { cancelled: false, idToken: response.data.idToken };
  },

  async signOut(): Promise<void> {
    ensureConfigured();
    await GoogleSignin.signOut();
  },
};
