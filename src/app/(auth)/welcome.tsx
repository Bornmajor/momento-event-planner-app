import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, Button, OfflineBanner } from '@/components/ui';
import { FooterLink } from '@/features/auth/presentation/components/auth-parts';
import { WelcomeCollage } from '@/features/welcome/collage';
import { useTheme } from '@/core/theme/use-theme';

/**
 * First screen after the splash (design/README.md): collage on top, then centred app name, slogan,
 * Get Started and "Already have an account? Sign In".
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {/* The collage fills the space above the text; the text block keeps its natural height. */}
      <WelcomeCollage />
      <SafeAreaView edges={['bottom']} style={[styles.content, { padding: spacing.xl, gap: spacing.lg }]}>
        <OfflineBanner />
        <View style={{ gap: spacing.sm }}>
          <AppText variant="display" align="center" accessibilityRole="header">
            {t('app.name')}
          </AppText>
          <AppText color="textMuted" align="center">
            {t('app.slogan')}
          </AppText>
        </View>
        <Button label={t('welcome.getStarted')} onPress={() => router.push('/sign-up')} />
        <FooterLink
          prompt={t('welcome.haveAccount')}
          action={t('welcome.signIn')}
          onPress={() => router.push('/sign-in')}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { justifyContent: 'center' },
});
