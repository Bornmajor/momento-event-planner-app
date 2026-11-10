import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, BackButton, Button, snackbar } from '@/components/ui';
import { failureMessage } from '@/core/failures';
import { useTheme } from '@/core/theme/use-theme';

import { EmailTakenFailure, GoogleSignInFailure } from '../../domain/failures';
import { googleSignInEnabled, useGoogleSignIn } from '../hooks/use-google-sign-in';

/** Google sign-in failures in Google's own words; anything else uses the shared messages. */
function googleFailureMessage(failure: unknown): string {
  if (failure instanceof GoogleSignInFailure) {
    return failure.reason === 'noPlayServices' ? 'auth.googleNoPlayServices' : 'auth.googleFailed';
  }
  if (failure instanceof EmailTakenFailure) return 'auth.googleEmailTaken';
  return failureMessage(failure);
}

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
      if (result?.isNewUser) snackbar.success(t('signUp.welcome', { name: result.user.firstName }));
    } catch (failure) {
      snackbar.error(t(googleFailureMessage(failure)));
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
