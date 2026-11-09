import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Screen, TextField } from '@/components/ui';
import { AuthHeader, FooterLink } from '@/features/auth/components/auth-parts';

/** UI template only in Version 1 (intent.md): no API call yet. */
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState(false);
  return (
    <Screen scroll>
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
      <View style={{ flex: 1 }} />
      <Button label={t('auth.sendCode')} onPress={() => setNotice(true)} accessibilityHint={t('common.comingSoon')} />
      <FooterLink
        prompt={t('auth.rememberPassword')}
        action={t('auth.signIn')}
        onPress={() => router.replace('/sign-in')}
      />
    </Screen>
  );
}
