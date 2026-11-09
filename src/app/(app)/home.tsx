import { useTranslation } from 'react-i18next';

import { SettingsPreview } from '@/components/settings-preview';
import { AppText, Button, OfflineBanner, Screen } from '@/components/ui';
import { signOut } from '@/features/auth/session';

/** Batch 1 placeholder. Replaced by the tabs (Explore · My Events · Settings) in Batch 3. */
export default function SignedInPlaceholder() {
  const { t } = useTranslation();
  return (
    <Screen style={{ justifyContent: 'center' }}>
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
