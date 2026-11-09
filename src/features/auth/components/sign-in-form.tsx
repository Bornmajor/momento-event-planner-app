import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Checkbox, PasswordField, TextField, type TextInputRef } from '@/components/ui';
import { MIN_TOUCH } from '@/theme/tokens';

import { applyApiError } from '../form-errors';
import { signInSchema, type SignInValues } from '../schemas';
import { useSignIn } from '../use-auth-mutations';
import { FormMessage } from './auth-parts';

export function SignInForm() {
  const { t } = useTranslation();
  const signIn = useSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<TextInputRef>(null);

  const { control, handleSubmit, setError } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn.mutateAsync(values);
      // Success: the session flips the route guard to the signed-in area.
    } catch (error) {
      setFormError(applyApiError(error, ['email', 'password'], setError));
    }
  });

  return (
    <View style={styles.gap}>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            label={t('auth.email')}
            icon="mail-outline"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message && t(fieldState.error.message)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <PasswordField
            ref={passwordRef}
            label={t('auth.password')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message && t(fieldState.error.message)}
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={() => void onSubmit()}
          />
        )}
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
      <FormMessage messageKey={formError} />
      <Button label={t('auth.signIn')} onPress={onSubmit} loading={signIn.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  bold: { fontWeight: '700' },
});
