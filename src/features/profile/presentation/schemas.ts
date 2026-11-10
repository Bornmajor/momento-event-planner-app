import { z } from 'zod';

import type { ProfileChanges } from '../domain/models/profile';

const name = z.string().trim().min(1, { message: 'validation.nameRequired' }).max(50, { message: 'validation.nameTooLong' });

/**
 * Profile form (spec §6). The phone is optional; when given it must be international, starting with + (the backend
 * stores it as E.164 and also accepts spaces and dashes). Empty clears it.
 */
export const profileSchema = z.object({
  firstName: name,
  lastName: name,
  phone: z
    .string()
    .trim()
    .refine((p) => p === '' || /^\+[\d\s()-]{7,20}$/.test(p), { message: 'validation.phone' }),
});
export type ProfileValues = z.input<typeof profileSchema>;

/** Form values → the changes to save (trimmed; an empty phone clears it). */
export function toProfileChanges(values: ProfileValues): ProfileChanges {
  const parsed = profileSchema.parse(values);
  return { firstName: parsed.firstName, lastName: parsed.lastName, phone: parsed.phone === '' ? null : parsed.phone };
}
