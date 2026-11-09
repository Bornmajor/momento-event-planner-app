import { useState } from 'react';

/**
 * Google sign-in, deferred (2026-11-09: Version 1 starts with email and password only). The `SocialSignIn`
 * component is kept but not shown on any screen. To enable later: wire the native library (plan task 2.1, needs
 * the dev build and Google Cloud client IDs), replace this hook, and render <SocialSignIn /> on Sign In / Sign Up.
 */
export function useGoogleSignIn() {
  const [errorKey, setErrorKey] = useState<string | null>(null);
  return {
    isPending: false,
    errorKey,
    signIn: () => setErrorKey('auth.googleUnavailable'),
  };
}
