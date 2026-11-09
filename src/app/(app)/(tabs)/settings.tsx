import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { errorMessageKey } from '@/api/errors';
import { AppText, Button, OfflineBanner, SegmentedControl, snackbar } from '@/components/ui';
import { signOut, useSession } from '@/features/auth/session';
import { deleteAccount } from '@/features/profile/account';
import { useMe } from '@/features/profile/use-me';
import { useUpdateLanguage } from '@/features/saved-events/mutations';
import { useLanguageStore } from '@/features/settings/language-store';
import { LANGUAGE_NAMES, LANGUAGES, type AppLanguage } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import { MIN_TOUCH } from '@/theme/tokens';
import { useThemeStore, type ThemePreference } from '@/theme/theme-store';
import { useTheme } from '@/theme/use-theme';

/** Settings (spec §6): profile, theme, language (also saved to the account), sign out, delete account. */
export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const { data: user } = useMe();
  const userId = useSession((s) => s.userId);
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const updateLanguage = useUpdateLanguage();
  const [deleting, setDeleting] = useState(false);

  const chooseLanguage = (language: AppLanguage) => {
    setLanguage(language);
    updateLanguage.mutate(language); // queued while offline
  };

  const confirmSignOut = () =>
    Alert.alert(t('settings.signOutTitle'), t('settings.signOutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.signOut'), style: 'destructive', onPress: () => void signOut() },
    ]);

  const confirmDelete = () =>
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteConfirm'),
        style: 'destructive',
        onPress: async () => {
          if (!userId) return;
          setDeleting(true);
          try {
            await deleteAccount(userId); // signs out; the route guard returns to Welcome
            snackbar.success(t('settings.deleted'));
          } catch (error) {
            logger.warn('delete account failed', error);
            snackbar.error(t(errorMessageKey(error)));
            setDeleting(false);
          }
        },
      },
    ]);

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '·';
  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg }];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <OfflineBanner />
        <AppText variant="title" accessibilityRole="header">
          {t('tabs.settings')}
        </AppText>

        {/* Profile */}
        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel={t('settings.editProfile')}
          style={({ pressed }) => [...card, styles.profile, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={[styles.avatar, { backgroundColor: colors.brand }]}>
            <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
              {initials}
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {user ? `${user.firstName} ${user.lastName}`.trim() : ' '}
            </AppText>
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {user?.email ?? ' '}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        {/* Preferences */}
        <View style={[...card, { gap: spacing.lg }]}>
          <SegmentedControl label={t('settings.theme')} options={themeOptions} value={preference} onChange={setPreference} />
          <SegmentedControl
            label={t('settings.language')}
            options={LANGUAGES.map((code) => ({ value: code, label: LANGUAGE_NAMES[code] }))}
            value={i18n.language as AppLanguage}
            onChange={chooseLanguage}
          />
          <AppText variant="caption" color="textMuted">
            {t('settings.languageHint')}
          </AppText>
        </View>

        <Button label={t('settings.signOut')} variant="outline" icon="log-out-outline" onPress={confirmSignOut} />

        <Pressable
          onPress={confirmDelete}
          disabled={deleting}
          accessibilityRole="button"
          style={({ pressed }) => [styles.danger, { opacity: pressed || deleting ? 0.6 : 1 }]}>
          <AppText variant="caption" color="danger" style={styles.bold}>
            {deleting ? t('settings.deleting') : t('settings.deleteAccount')}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  card: { borderWidth: StyleSheet.hairlineWidth },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  danger: { minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  bold: { fontWeight: '700' },
});
