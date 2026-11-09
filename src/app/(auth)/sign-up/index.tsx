import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { OfflineBanner, Screen } from '@/components/ui';
import { FooterLink } from '@/features/auth/components/auth-parts';
import { DetailsStep } from '@/features/auth/components/sign-up-steps';

/** Sign Up step 1 of 2: first name, last name, email. */
export default function SignUpDetailsScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll edges={['bottom', 'left', 'right']}>
      <OfflineBanner />
      <DetailsStep />
      <FooterLink prompt={t('auth.haveAccount')} action={t('auth.signIn')} onPress={() => router.replace('/sign-in')} />
    </Screen>
  );
}
