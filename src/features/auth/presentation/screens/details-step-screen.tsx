import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormTextField } from '@/components/form/form-fields';
import { Button, FormScreen, OfflineBanner, type TextInputRef } from '@/components/ui';

import { AuthHeader, FooterLink, SocialSignIn } from '../components/auth-parts';
import { detailsSchema, type DetailsValues } from '../schemas';
import { useSignUpDraft } from '../state/sign-up-draft-store';

/** Sign Up step 1 of 2: basic details. Saved to the in-memory draft, then on to the password step. */
export function DetailsStepScreen() {
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
          <SocialSignIn />
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
