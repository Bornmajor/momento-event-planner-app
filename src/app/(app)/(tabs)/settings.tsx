import { useTranslation } from 'react-i18next';

import { SettingsPreview } from '@/components/settings-preview';
import { AppText, Button, OfflineBanner, Screen } from '@/components/ui';
import { signOut } from '@/features/auth/session';

/** Temporary Settings tab: theme and language switches and sign out. Full Settings and Profile come in Batch 4. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top', 'left', 'right']} style={{ justifyContent: 'center' }}>
      <OfflineBanner />
      <AppText variant="title" align="center">
        {t('app.name')}
      </AppText>
      <AppText color="textMuted" align="center">
        {t('placeholder.signedIn')}
      </AppText>
      <SettingsPreview />
      <Button label={t('placeholder.signOut')} variant="outline" onPress={() => void signOut()} />
    </Screen>
  );
}
