/** A user holds a *set* of roles (not a single enum) — they can be both a
 * seeker and a provider over time. Admin is granted out of band. */
export enum UserRole {
  SEEKER = 'seeker',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}
