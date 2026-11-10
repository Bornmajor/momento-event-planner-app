import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, BackButton, Button, snackbar } from '@/components/ui';
import { MIN_TOUCH } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/use-theme';

import { GoogleSignInError, googleSignInEnabled, useGoogleSignIn } from '../use-google-sign-in';

/** Back button, optional round icon, centred title and subtitle (auth design). */
export function AuthHeader({
  title,
  subtitle,
  icon,
  showBack = true,
}: {
  title: string;
  subtitle: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  showBack?: boolean;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      {showBack && <BackButton />}
      {icon && (
        <View style={[styles.iconCircle, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name={icon} size={30} color={colors.brand} />
        </View>
      )}
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title" align="center" accessibilityRole="header">
          {title}
        </AppText>
        <AppText color="textMuted" align="center">
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

/** "Don't have an account? Sign Up" style footer. */
export function FooterLink({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.footer}>
      <AppText variant="caption" color="textMuted">
        {prompt}
      </AppText>
      <Pressable onPress={onPress} accessibilityRole="link" hitSlop={10} style={styles.footerAction}>
        <AppText variant="caption" style={styles.bold}>
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}

/** A form-level error (e.g. wrong credentials, offline), announced by screen readers. */
export function FormMessage({ messageKey }: { messageKey: string | null }) {
  const { t } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  if (!messageKey) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.message, { borderRadius: radii.md, borderColor: colors.danger, padding: spacing.md }]}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
      <AppText variant="caption" color="danger" style={styles.flex}>
        {t(messageKey)}
      </AppText>
    </View>
  );
}

/** "or continue with" + the Google button. Hidden when no Google client ID is configured. */
export function SocialSignIn() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const google = useGoogleSignIn();
  if (!googleSignInEnabled) return null;

  const onPress = async () => {
    try {
      const result = await google.mutateAsync();
      // Success: the session flips the route guard to the signed-in area.
      if (result?.isNewUser) snackbar.success(t('signUp.welcome', { name: result.firstName }));
    } catch (error) {
      snackbar.error(t(error instanceof GoogleSignInError ? error.messageKey : 'errors.UNKNOWN'));
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.dividerRow}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <AppText variant="caption" color="textMuted">
          {t('auth.continueWith')}
        </AppText>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
      <Button
        label={t('auth.google')}
        variant="outline"
        icon="logo-google"
        loading={google.isPending}
        onPress={() => void onPress()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  footerAction: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  bold: { fontWeight: '700' },
  message: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1 },
  flex: { flex: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
