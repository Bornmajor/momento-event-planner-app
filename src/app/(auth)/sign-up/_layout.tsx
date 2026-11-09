import { router, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, BackButton, SegmentedBar } from '@/components/ui';
import { useSignUpDraft } from '@/features/auth/sign-up-draft';
import { useTheme } from '@/theme/use-theme';

const STEPS = 2;

/**
 * Sign Up onboarding: step 1 basic details, step 2 password. The progress header sits inside the top safe area (clear
 * of the notch / status bar) and stays put while the steps slide underneath, so the bar animates between steps.
 */
export default function SignUpLayout() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const step = usePathname().endsWith('/password') ? 2 : 1;

  // The draft lives only while the onboarding is open: cleared once the account exists or the user backs out.
  useEffect(() => () => useSignUpDraft.getState().reset(), []);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top', 'left', 'right']}>
        <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.md }]}>
          <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
          <View style={[styles.fill, { gap: spacing.xs }]}>
            <SegmentedBar
              segments={STEPS}
              filled={step}
              color={colors.brand}
              accessibilityLabel={t('signUp.progress', { step, total: STEPS })}
            />
            <AppText variant="caption" color="textMuted">
              {t('signUp.progress', { step, total: STEPS })}
            </AppText>
          </View>
        </View>
      </SafeAreaView>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
});
