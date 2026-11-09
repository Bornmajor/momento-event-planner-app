import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/api/errors';
import { FormPasswordField, FormTextField } from '@/components/form/form-fields';
import { Button, FormScreen, OfflineBanner, snackbar, type TextInputRef } from '@/components/ui';

import { applyApiError } from '../form-errors';
import { detailsSchema, passwordStepSchema, type DetailsValues, type PasswordStepValues } from '../schemas';
import { useSignUpDraft } from '../sign-up-draft';
import { useSignUp } from '../use-auth-mutations';
import { AuthHeader, FooterLink } from './auth-parts';
import { PasswordStrengthMeter } from './password-strength-meter';

/** Step 1: basic details. Saved to the in-memory draft, then on to the password step. */
export function DetailsStep() {
  const { t } = useTranslation();
  const draft = useSignUpDraft((s) => s.details);
  const emailError = useSignUpDraft((s) => s.emailError);
  const setDetails = useSignUpDraft((s) => s.setDetails);
  // One hook call per statement (React Compiler, see the sign-up crash fix).
  const lastNameRef = useRef<TextInputRef>(null);
  const emailRef = useRef<TextInputRef>(null);

  const { control, handleSubmit, setError } = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: draft ?? { firstName: '', lastName: '', email: '' },
  });

  // Sent back from step 2 because the email is taken: mark the field.
  useEffect(() => {
    if (emailError) setError('email', { message: emailError }, { shouldFocus: true });
  }, [emailError, setError]);

  const onContinue = handleSubmit((values) => {
    setDetails(values);
    router.push('/sign-up/password');
  });

  return (
    // The onboarding layout above handles the top safe area (progress header).
    <FormScreen
      edges={['bottom', 'left', 'right']}
      actions={
        <>
          <Button label={t('signUp.continue')} onPress={onContinue} />
          <FooterLink prompt={t('auth.haveAccount')} action={t('auth.signIn')} onPress={() => router.replace('/sign-in')} />
        </>
      }>
      <OfflineBanner />
      <AuthHeader title={t('signUp.detailsTitle')} subtitle={t('signUp.detailsSubtitle')} showBack={false} />
      <FormTextField
        control={control}
        name="firstName"
        label={t('auth.firstName')}
        icon="person-outline"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
        onSubmitEditing={() => lastNameRef.current?.focus()}
      />
      <FormTextField
        ref={lastNameRef}
        control={control}
        name="lastName"
        label={t('auth.lastName')}
        icon="person-outline"
        autoComplete="family-name"
        textContentType="familyName"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <FormTextField
        ref={emailRef}
        control={control}
        name="email"
        label={t('auth.email')}
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => void onContinue()}
      />
    </FormScreen>
  );
}

/** Step 2: password + confirmation with live strength, then create the account. */
export function PasswordStep({ details }: { details: DetailsValues }) {
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
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_TAKEN') {
        setEmailError('errors.EMAIL_TAKEN');
        snackbar.error(t('errors.EMAIL_TAKEN'));
        router.back();
        return;
      }
      const messageKey = applyApiError(error, ['password'], setError);
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
