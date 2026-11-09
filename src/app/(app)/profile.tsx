import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { User } from '@/api/endpoints';
import { FormTextField } from '@/components/form/form-fields';
import { AppText, BackButton, Button, FormScreen, OfflineBanner, snackbar, TextField, type TextInputRef } from '@/components/ui';
import { applyApiError } from '@/features/auth/form-errors';
import { profileSchema, useUpdateProfile, type ProfileValues } from '@/features/profile/account';
import { useMe } from '@/features/profile/use-me';
import { useTheme } from '@/theme/use-theme';

/** Profile (spec §6): first name, last name and phone; email shown but not editable. */
export default function ProfileScreen() {
  const { data: user } = useMe();
  const { colors, spacing } = useTheme();
  if (!user) {
    return (
      <FormScreen actions={null}>
        <BackButton />
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xxxl }} />
      </FormScreen>
    );
  }
  return <ProfileForm user={user} />;
}

function ProfileForm({ user }: { user: User }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const update = useUpdateProfile();
  // One hook call per statement (React Compiler).
  const lastNameRef = useRef<TextInputRef>(null);
  const phoneRef = useRef<TextInputRef>(null);

  const { control, handleSubmit, setError, formState } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' },
  });

  const onSave = handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values);
      snackbar.success(t('profile.saved'));
      router.back();
    } catch (error) {
      const messageKey = applyApiError(error, ['firstName', 'lastName', 'phone'], setError);
      if (messageKey) snackbar.error(t(messageKey));
    }
  });

  return (
    <FormScreen
      actions={
        <Button label={t('profile.save')} onPress={onSave} loading={update.isPending} disabled={!formState.isDirty} />
      }>
      <OfflineBanner />
      <View style={[styles.topBar, { gap: spacing.md }]}>
        <BackButton />
        <AppText variant="heading" accessibilityRole="header">
          {t('profile.title')}
        </AppText>
      </View>
      <FormTextField
        control={control}
        name="firstName"
        label={t('auth.firstName')}
        icon="person-outline"
        autoComplete="given-name"
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
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <FormTextField
        ref={phoneRef}
        control={control}
        name="phone"
        label={t('profile.phone')}
        icon="call-outline"
        keyboardType="phone-pad"
        autoComplete="tel"
        returnKeyType="done"
        onSubmitEditing={() => void onSave()}
      />
      <AppText variant="caption" color="textMuted" style={{ paddingHorizontal: spacing.lg }}>
        {t('profile.phoneHint')}
      </AppText>
      <TextField label={t('auth.email')} icon="mail-outline" value={user.email} editable={false} />
      <AppText variant="caption" color="textMuted" style={{ paddingHorizontal: spacing.lg }}>
        {t('profile.emailHint')}
      </AppText>
    </FormScreen>
  );
}

const styles = StyleSheet.create({ topBar: { flexDirection: 'row', alignItems: 'center' } });
