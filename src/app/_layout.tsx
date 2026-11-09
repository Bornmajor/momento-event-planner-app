import '@/lib/i18n';
// Registers the offline-capable save mutation before the cache restores queued ones (spec §5.2).
import '@/features/saved-events/mutations';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { SnackbarHost } from '@/components/ui';
import { restoreSession, useSession } from '@/features/auth/session';
import { syncDeviceLanguage, useLanguageStore } from '@/features/settings/language-store';
import { persistOptions, queryClient } from '@/lib/query-client';
import { useThemeStore } from '@/theme/theme-store';
import { useTheme } from '@/theme/use-theme';

// Keep the splash up until the session and the offline cache are restored (spec §4).
SplashScreen.preventAutoHideAsync();

// Touch the persisted stores so they rehydrate (and apply theme/language) at start-up.
useThemeStore.persist.hasHydrated();
useLanguageStore.persist.hasHydrated();

export default function RootLayout() {
  const [cacheRestored, setCacheRestored] = useState(false);
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={() => {
        setCacheRestored(true);
        // Send save/remove actions that were queued offline before the app closed.
        void queryClient.resumePausedMutations();
      }}>
      <RootNavigator cacheRestored={cacheRestored} />
    </PersistQueryClientProvider>
  );
}

function RootNavigator({ cacheRestored }: { cacheRestored: boolean }) {
  const status = useSession((s) => s.status);
  const { scheme, colors } = useTheme();

  useEffect(() => {
    void restoreSession();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncDeviceLanguage();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (status !== 'restoring' && cacheRestored) SplashScreen.hide();
  }, [status, cacheRestored]);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.brand,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  const signedIn = status === 'signedIn';
  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        {/* "/" redirects to welcome or home, so the app always opens on a real screen. */}
        <Stack.Screen name="index" />
        {/* redirectTo makes sign-in/sign-out land on a defined screen. */}
        <Stack.Protected guard={signedIn} redirectTo="/welcome">
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/home">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <SnackbarHost />
    </ThemeProvider>
  );
}
