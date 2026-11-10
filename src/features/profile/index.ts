/**
 * Profile's public API: the only profile imports other features may use (spec §12.1). The profile screen is reached
 * through its route file in src/app.
 */
export { deleteAccount } from './presentation/account-actions';
export { useMe } from './presentation/hooks/use-me';
export { queueLanguageUpdate, useUpdateLanguage } from './presentation/language-mutation';
