import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useState, type ComponentProps, type ComponentRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MIN_TOUCH } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { AppText } from './app-text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  /** Used as the accessibility label (the design has no visible labels, only placeholders). */
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  error?: string;
  trailing?: ReactNode;
}

/** Pill input with a leading icon and an error line underneath (auth design). */
type TextInputRef = ComponentRef<typeof TextInput>;

export const TextField = forwardRef<TextInputRef, TextFieldProps>(function TextField(
  { label, icon, error, trailing, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors, radii, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.brand : colors.border;

  return (
    <View style={{ gap: spacing.xs }}>
      <View
        style={[
          styles.field,
          { borderColor, borderRadius: radii.pill, backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
        ]}>
        {icon && <Ionicons name={icon} size={20} color={colors.textMuted} />}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholder={label}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.brand}
          style={[styles.input, typography.body, { color: colors.text }]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {trailing}
      </View>
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite" style={{ paddingHorizontal: spacing.lg }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

/** TextField with a lock icon and a show/hide toggle. */
export const PasswordField = forwardRef<TextInputRef, Omit<TextFieldProps, 'secureTextEntry' | 'trailing'>>(
  function PasswordField(props, ref) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);
    return (
      <TextField
        ref={ref}
        icon="lock-closed-outline"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        {...props}
        secureTextEntry={!visible}
        trailing={
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={visible ? t('a11y.hidePassword') : t('a11y.showPassword')}>
            <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        }
      />
    );
  },
);

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: Math.max(MIN_TOUCH, 54), borderWidth: 1 },
  input: { flex: 1, paddingVertical: 12 },
});
