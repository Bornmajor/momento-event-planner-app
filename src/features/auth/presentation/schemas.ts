import { z } from 'zod';

import { estimateStrength, MIN_STRENGTH } from './password-strength';

/**
 * Form rules mirroring the backend (backend docs/API-REFERENCE.md). Messages are translation keys, so the screen
 * shows them in the user's language with t(message).
 */
const email = z.string().trim().toLowerCase().pipe(z.email({ message: 'validation.email' }));
const name = z.string().trim().min(1, { message: 'validation.nameRequired' }).max(50, { message: 'validation.nameTooLong' });

const PASSWORD_MAX_BYTES = 72; // bcrypt limit on the backend

/** Each password rule on its own, for the live checklist on Sign Up. */
export function passwordChecks(password: string) {
  return {
    length: password.length >= 8 && new TextEncoder().encode(password).length <= PASSWORD_MAX_BYTES,
    letter: /[A-Za-z]/.test(password),
    digit: /\d/.test(password),
  };
}


export const signInSchema = z.object({
  email,
  password: z.string().min(1, { message: 'validation.passwordRequired' }),
  remember: z.boolean(),
});
export type SignInValues = z.input<typeof signInSchema>;

/** Sign Up step 1: basic details. */
export const detailsSchema = z.object({
  firstName: name,
  lastName: name,
  email,
});
export type DetailsValues = z.input<typeof detailsSchema>;

/**
 * Sign Up step 2: password and confirmation. The password must meet the backend rules and not be too easy to guess;
 * userInputs (name, email) count against it, so "Ada2024" is weak for Ada.
 */
export function passwordStepSchema(userInputs: string[] = []) {
  return z
    .object({
      password: z
        .string()
        .min(1, { message: 'validation.passwordRequired' })
        .refine((p) => Object.values(passwordChecks(p)).every(Boolean), { message: 'validation.passwordRules' })
        .refine((p) => estimateStrength(p, userInputs) >= MIN_STRENGTH, { message: 'validation.passwordWeak' }),
      confirmPassword: z.string().min(1, { message: 'validation.confirmRequired' }),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: 'validation.passwordsMatch',
      path: ['confirmPassword'],
    });
}
export type PasswordStepValues = z.input<ReturnType<typeof passwordStepSchema>>;

/** What the register endpoint takes. */
export type SignUpValues = DetailsValues & { password: string };

export const forgotPasswordSchema = z.object({ email });
