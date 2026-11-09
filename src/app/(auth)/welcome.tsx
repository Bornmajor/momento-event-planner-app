import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SettingsPreview } from '@/components/settings-preview';
import { AppText, OfflineBanner, Screen } from '@/components/ui';

/** Batch 1 placeholder. The real welcome screen (photo collage, Get Started, Sign In) arrives in Batch 2. */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll style={styles.center}>
      <OfflineBanner />
      <Image
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel={t('a11y.logo')}
      />
      <View style={{ gap: 6 }}>
        <AppText variant="display" align="center">
          {t('app.name')}
        </AppText>
        <AppText color="textMuted" align="center">
          {t('app.slogan')}
        </AppText>
      </View>
      <AppText variant="caption" color="textMuted" align="center">
        {t('placeholder.signedOut')}
      </AppText>
      <SettingsPreview />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  logo: { width: 96, height: 96 },
});
