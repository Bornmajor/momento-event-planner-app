import { router, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, BackButton, SegmentedBar } from '@/components/ui';
import { useTheme } from '@/core/theme/use-theme';

import { useSignUpDraft } from '../state/sign-up-draft-store';

const STEPS = 2;

/**
 * Sign Up onboarding: step 1 basic details, step 2 password. Inside the top safe area (clear of the notch / status
 * bar): a top bar with the back button, then the two-segment progress indicator. It stays put while the steps slide
 * underneath, so the bar animates between steps.
 */
export function SignUpLayout() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const step = usePathname().endsWith('/password') ? 2 : 1;

  // The draft lives only while the onboarding is open: cleared once the account exists or the user backs out.
  useEffect(() => () => useSignUpDraft.getState().reset(), []);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top', 'left', 'right']}>
        {/* Top bar first (back), then the progress indicator underneath. */}
        <View style={[styles.topBar, { paddingHorizontal: spacing.xl, paddingTop: spacing.sm }]}>
          <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
        </View>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.xs }}>
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
  topBar: { flexDirection: 'row', alignItems: 'center' },
});
