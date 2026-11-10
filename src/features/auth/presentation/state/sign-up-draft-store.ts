import { create } from 'zustand';

import type { DetailsValues } from '../schemas';

/**
 * Sign Up details carried from step 1 to step 2. Kept in memory only (never persisted) and cleared once the account
 * is created. emailError lets step 2 send the user back with the email field marked (e.g. already registered).
 */
interface SignUpDraft {
  details: DetailsValues | null;
  emailError: string | null;
  setDetails: (details: DetailsValues) => void;
  setEmailError: (key: string | null) => void;
  reset: () => void;
}

export const useSignUpDraft = create<SignUpDraft>((set) => ({
  details: null,
  emailError: null,
  setDetails: (details) => set({ details, emailError: null }),
  setEmailError: (emailError) => set({ emailError }),
  reset: () => set({ details: null, emailError: null }),
}));
