import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { applyFailure } from '@/components/form/apply-failure';
import { FormPasswordField } from '@/components/form/form-fields';
import { Button, FormScreen, OfflineBanner, snackbar, type TextInputRef } from '@/components/ui';

import { EmailTakenFailure } from '../../domain/failures';
import { AuthHeader } from '../components/auth-parts';
import { PasswordStrengthMeter } from '../components/password-strength-meter';
import { useSignUp } from '../hooks/use-sign-up';
import { passwordStepSchema, type DetailsValues, type PasswordStepValues } from '../schemas';
import { useSignUpDraft } from '../state/sign-up-draft-store';

/** Sign Up step 2 of 2. Without step 1's details (e.g. after a reload), go back to it. */
export function PasswordStepScreen() {
  const details = useSignUpDraft((s) => s.details);
  if (!details) return <Redirect href="/sign-up" />;
  return <PasswordStepForm details={details} />;
}

/** Password + confirmation with live strength, then create the account. */
export function PasswordStepForm({ details }: { details: DetailsValues }) {
  const { t } = useTranslation();
  const signUp = useSignUp();
  const setEmailError = useSignUpDraft((s) => s.setEmailError);
  const confirmRef = useRef<TextInputRef>(null);
  // The user's own details count against the password ("Ada2024" is weak for Ada).
  const userInputs = [details.firstName, details.lastName, details.email, details.email.split('@')[0]];

  const { control, handleSubmit, setError } = useForm<PasswordStepValues>({
    resolver: zodResolver(passwordStepSchema(userInputs)),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async ({ password: chosen }) => {
    try {
      await signUp.mutateAsync({ ...details, password: chosen });
      // The session flips the route guard to the signed-in area.
      snackbar.success(t('signUp.welcome', { name: details.firstName.trim() }));
    } catch (failure) {
      if (failure instanceof EmailTakenFailure) {
        // The email is on step 1: go back there with the field marked.
        setEmailError('errors.EMAIL_TAKEN');
        snackbar.error(t('errors.EMAIL_TAKEN'));
        router.back();
        return;
      }
      const messageKey = applyFailure(failure, ['password'], setError);
      if (messageKey) snackbar.error(t(messageKey));
    }
  });

  return (
    <FormScreen
      edges={['bottom', 'left', 'right']}
      actions={<Button label={t('signUp.createAccount')} onPress={onSubmit} loading={signUp.isPending} />}>
      <OfflineBanner />
      <AuthHeader title={t('signUp.passwordTitle')} subtitle={t('signUp.passwordSubtitle')} showBack={false} />
      <FormPasswordField
        control={control}
        name="password"
        label={t('auth.password')}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <FormPasswordField
        ref={confirmRef}
        control={control}
        name="confirmPassword"
        label={t('auth.confirmPassword')}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void onSubmit()}
      />
      <PasswordStrengthMeter password={password} userInputs={userInputs} />
    </FormScreen>
  );
}
