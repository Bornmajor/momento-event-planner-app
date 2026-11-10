/** What the profile screen can change. An empty phone is stored as null. */
export interface ProfileChanges {
  firstName: string;
  lastName: string;
  phone: string | null;
}
