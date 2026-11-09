import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { OfflineBanner, Screen } from '@/components/ui';
import { AuthHeader, FooterLink } from '@/features/auth/components/auth-parts';
import { SignUpForm } from '@/features/auth/components/sign-up-form';

export default function SignUpScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <OfflineBanner />
      <AuthHeader title={t('auth.signUpTitle')} subtitle={t('auth.signUpSubtitle')} />
      <SignUpForm />
      <FooterLink prompt={t('auth.haveAccount')} action={t('auth.signIn')} onPress={() => router.replace('/sign-in')} />
    </Screen>
  );
}
