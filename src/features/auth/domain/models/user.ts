/** The app's languages (also the languages the AI can write in). */
export type Language = 'en' | 'fr' | 'sw';

/** A Momento account. JSON-safe (dates are ISO strings) because it is kept in the persisted query cache. */
export interface User {
  id: string;
  email: string;
  firstName: string;
  /** May be empty for Google accounts without a family name. */
  lastName: string;
  phone: string | null;
  language: Language;
  authProviders: ('password' | 'google')[];
  /** ISO date-time. */
  createdAt: string;
}
