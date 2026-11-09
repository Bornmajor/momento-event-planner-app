import { Appearance } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Applies the preference app-wide. `Appearance.setColorScheme` overrides the colour scheme for the whole app
 * (including native alerts and pickers); 'auto' removes the override and follows the system (RN Appearance docs).
 * `useColorScheme()` reflects the override, so every themed component updates.
 */
export function applyThemePreference(preference: ThemePreference) {
  Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
}

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => {
        applyThemePreference(preference);
        set({ preference });
      },
    }),
    {
      name: 'momento.theme',
      storage: zustandStorage,
      onRehydrateStorage: () => (state) => {
        if (state) applyThemePreference(state.preference);
      },
    },
  ),
);
