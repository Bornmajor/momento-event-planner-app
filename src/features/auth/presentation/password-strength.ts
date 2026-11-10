import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import { adjacencyGraphs, dictionary } from '@zxcvbn-ts/language-common';
import { useDeferredValue, useMemo } from 'react';

/**
 * Password strength by guessability (zxcvbn): it spots common passwords, keyboard patterns, repeats, dates and the
 * user's own name or email, instead of only counting character types. Score 0–4.
 */
export type StrengthScore = 0 | 1 | 2 | 3 | 4;

/** Below this the password is too easy to guess and Sign Up won't accept it (on top of the backend rules). */
export const MIN_STRENGTH: StrengthScore = 2;

let estimator: ZxcvbnFactory | null = null;

/** Built on first use, so the dictionaries load only when someone is choosing a password. */
function getEstimator() {
  estimator ??= new ZxcvbnFactory({ dictionary, graphs: adjacencyGraphs, useLevenshteinDistance: true });
  return estimator;
}

export function estimateStrength(password: string, userInputs: string[] = []): StrengthScore {
  if (!password) return 0;
  return getEstimator().check(password, userInputs).score as StrengthScore;
}

/** Strength for the live meter. The deferred value keeps typing smooth while the estimate catches up. */
export function usePasswordStrength(password: string, userInputs: string[]) {
  const deferred = useDeferredValue(password);
  // A string key, so a new array with the same names doesn't re-run the estimate.
  const key = userInputs.filter(Boolean).join('\n');
  return useMemo(() => (deferred ? estimateStrength(deferred, key ? key.split('\n') : []) : null), [deferred, key]);
}
