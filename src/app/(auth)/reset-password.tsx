import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppText, Button, FormScreen, PasswordField } from '@/components/ui';
import { AuthHeader } from '@/features/auth/components/auth-parts';
import { PasswordStrengthMeter } from '@/features/auth/components/password-strength-meter';

/** UI template only in Version 1 (intent.md). Reached from the reset code flow once the backend supports it. */
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [notice, setNotice] = useState(false);
  return (
    <FormScreen
      actions={
        <Button label={t('auth.resetPassword')} onPress={() => setNotice(true)} accessibilityHint={t('common.comingSoon')} />
      }>
      <AuthHeader icon="shield-checkmark-outline" title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')} />
      <PasswordField label={t('auth.newPassword')} value={password} onChangeText={setPassword} />
      <PasswordField label={t('auth.confirmPassword')} value={confirm} onChangeText={setConfirm} />
      <PasswordStrengthMeter password={password} userInputs={[]} />
      {notice && (
        <AppText variant="caption" color="textMuted" align="center" accessibilityLiveRegion="polite">
          {t('auth.comingSoonBody')}
        </AppText>
      )}
    </FormScreen>
  );
}
