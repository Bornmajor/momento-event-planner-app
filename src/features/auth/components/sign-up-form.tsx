import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, PasswordField, TextField, type TextInputRef } from '@/components/ui';

import { applyApiError } from '../form-errors';
import { signUpSchema, type SignUpValues } from '../schemas';
import { useSignUp } from '../use-auth-mutations';
import { FormMessage, PasswordChecklist } from './auth-parts';

const FIELDS = ['firstName', 'lastName', 'email', 'password'] as const;

export function SignUpForm() {
  const { t } = useTranslation();
  const signUp = useSignUp();
  const [formError, setFormError] = useState<string | null>(null);
  // Each hook call is its own statement: inside an object literal the React Compiler caches them, so they run only
  // on the first render and the hook order breaks ("Should have a queue").
  const lastNameRef = useRef<TextInputRef>(null);
  const emailRef = useRef<TextInputRef>(null);
  const passwordRef = useRef<TextInputRef>(null);
  const refs = { lastName: lastNameRef, email: emailRef, password: passwordRef };

  const { control, handleSubmit, setError } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signUp.mutateAsync(values);
    } catch (error) {
      setFormError(applyApiError(error, FIELDS, setError));
    }
  });

  return (
    <View style={styles.gap}>
      <Controller
        control={control}
        name="firstName"
        render={({ field, fieldState }) => (
          <TextField
            label={t('auth.firstName')}
            icon="person-outline"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message && t(fieldState.error.message)}
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
            onSubmitEditing={() => refs.lastName.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="lastName"
        render={({ field, fieldState }) => (
          <TextField
            ref={refs.lastName}
            label={t('auth.lastName')}
            icon="person-outline"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message && t(fieldState.error.message)}
            autoComplete="family-name"
            textContentType="familyName"
            returnKeyType="next"
            onSubmitEditing={() => refs.email.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            ref={refs.email}
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
            onSubmitEditing={() => refs.password.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <PasswordField
            ref={refs.password}
            label={t('auth.password')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message && t(fieldState.error.message)}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={() => void onSubmit()}
          />
        )}
      />
      <PasswordChecklist password={password} />
      <FormMessage messageKey={formError} />
      <Button label={t('auth.signUp')} onPress={onSubmit} loading={signUp.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({ gap: { gap: 16 } });
