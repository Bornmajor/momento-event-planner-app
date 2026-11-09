import { z } from 'zod';

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

const newPassword = z.string().refine((p) => Object.values(passwordChecks(p)).every(Boolean), {
  message: 'validation.passwordRules',
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { message: 'validation.passwordRequired' }),
  remember: z.boolean(),
});
export type SignInValues = z.input<typeof signInSchema>;

export const signUpSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  password: newPassword,
});
export type SignUpValues = z.input<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email });
