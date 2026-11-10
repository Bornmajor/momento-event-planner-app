import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import i18n, { deviceLanguage, type AppLanguage } from '@/core/i18n/i18n';
import { zustandStorage } from '@/core/storage/zustand-storage';

interface LanguageState {
  /** The user's explicit choice; `null` means "follow the phone's language". */
  language: AppLanguage | null;
  setLanguage: (language: AppLanguage | null) => void;
}

/** The language currently in effect. */
export function effectiveLanguage(choice: AppLanguage | null): AppLanguage {
  return choice ?? deviceLanguage();
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: null,
      setLanguage: (language) => {
        void i18n.changeLanguage(effectiveLanguage(language));
        set({ language });
      },
    }),
    {
      name: 'momento.language',
      storage: zustandStorage,
      onRehydrateStorage: () => (state) => {
        void i18n.changeLanguage(effectiveLanguage(state?.language ?? null));
      },
    },
  ),
);

/**
 * When following the phone's language, re-read it (Android can change the locale without restarting the app;
 * expo-localization docs). Called when the app returns to the foreground.
 */
export function syncDeviceLanguage() {
  if (useLanguageStore.getState().language === null && i18n.language !== deviceLanguage()) {
    void i18n.changeLanguage(deviceLanguage());
  }
}
