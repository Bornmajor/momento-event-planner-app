import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppText, Button, FormScreen, TextField } from '@/components/ui';

import { AuthHeader, FooterLink } from '../components/auth-parts';

/** UI template only in Version 1 (intent.md): no API call yet. */
export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState(false);
  return (
    <FormScreen
      actions={
        <>
          <Button label={t('auth.sendCode')} onPress={() => setNotice(true)} accessibilityHint={t('common.comingSoon')} />
          <FooterLink
            prompt={t('auth.rememberPassword')}
            action={t('auth.signIn')}
            onPress={() => router.replace('/sign-in')}
          />
        </>
      }>
      <AuthHeader icon="lock-closed-outline" title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')} />
      <TextField
        label={t('auth.email')}
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {notice && (
        <AppText variant="caption" color="textMuted" align="center" accessibilityLiveRegion="polite">
          {t('auth.comingSoonBody')}
        </AppText>
      )}
    </FormScreen>
  );
}
