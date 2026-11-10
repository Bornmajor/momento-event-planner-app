/**
 * Auth's public API: the only auth imports other features may use (spec §12.1). Screens are reached through the
 * route files in src/app, not from here.
 */
export type { Language, User } from './domain/models/user';
export { toUser } from './data/mappers/user.mapper';
export { configureAuth, restoreSession, signOut } from './presentation/session-controller';
export { onSessionEnd, useSession, type SessionStatus } from './presentation/state/session-store';
