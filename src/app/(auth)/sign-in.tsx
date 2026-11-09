import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { OfflineBanner, Screen } from '@/components/ui';
import { AuthHeader, FooterLink } from '@/features/auth/components/auth-parts';
import { SignInForm } from '@/features/auth/components/sign-in-form';

export default function SignInScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <OfflineBanner />
      <AuthHeader title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')} />
      <SignInForm />
      <FooterLink prompt={t('auth.noAccount')} action={t('auth.signUp')} onPress={() => router.replace('/sign-up')} />
    </Screen>
  );
}
