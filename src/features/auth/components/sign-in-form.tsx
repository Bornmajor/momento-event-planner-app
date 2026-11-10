import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FormPasswordField, FormTextField } from '@/components/form/form-fields';
import { AppText, Button, Checkbox, FormScreen, OfflineBanner, snackbar, type TextInputRef } from '@/components/ui';
import { MIN_TOUCH } from '@/core/theme/tokens';

import { applyApiError } from '../form-errors';
import { signInSchema, type SignInValues } from '../schemas';
import { useSignIn } from '../use-auth-mutations';
import { AuthHeader, FooterLink, SocialSignIn } from './auth-parts';

/** The whole Sign In screen: header and fields scroll; Sign In and the Sign Up link are pinned at the bottom. */
export function SignInForm() {
  const { t } = useTranslation();
  const signIn = useSignIn();
  const passwordRef = useRef<TextInputRef>(null);

  const { control, handleSubmit, setError } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn.mutateAsync(values);
      // Success: the session flips the route guard to the signed-in area.
    } catch (error) {
      const messageKey = applyApiError(error, ['email', 'password'], setError);
      if (messageKey) snackbar.error(t(messageKey));
    }
  });

  return (
    <FormScreen
      actions={
        <>
          <Button label={t('auth.signIn')} onPress={onSubmit} loading={signIn.isPending} />
          <SocialSignIn />
          <FooterLink prompt={t('auth.noAccount')} action={t('auth.signUp')} onPress={() => router.replace('/sign-up')} />
        </>
      }>
      <OfflineBanner />
      <AuthHeader title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')} />
      <FormTextField
        control={control}
        name="email"
        label={t('auth.email')}
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <FormPasswordField
        ref={passwordRef}
        control={control}
        name="password"
        label={t('auth.password')}
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={() => void onSubmit()}
      />
      <View style={styles.row}>
        <Controller
          control={control}
          name="remember"
          render={({ field }) => (
            <Checkbox checked={field.value} onChange={field.onChange} label={t('auth.rememberMe')} />
          )}
        />
        <Pressable
          onPress={() => router.push('/forgot-password')}
          accessibilityRole="link"
          hitSlop={8}
          style={styles.link}>
          <AppText variant="caption" style={styles.bold}>
            {t('auth.forgotPassword')}
          </AppText>
        </Pressable>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  bold: { fontWeight: '700' },
});
