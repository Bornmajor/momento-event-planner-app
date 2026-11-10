import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/use-theme';

import { AppText } from './app-text';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Custom leading element (e.g. the Google logo). */
  leading?: ReactNode;
  accessibilityHint?: string;
}

/** Full-width pill button (auth design). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  leading,
  accessibilityHint,
}: ButtonProps) {
  const { colors, radii, spacing } = useTheme();
  const inactive = disabled || loading;

  const background = variant === 'primary' ? colors.primary : variant === 'outline' ? colors.surface : 'transparent';
  const foreground = variant === 'primary' ? colors.onPrimary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderRadius: radii.pill,
          paddingHorizontal: spacing.xl,
          borderColor: variant === 'outline' ? colors.border : 'transparent',
          opacity: inactive ? 0.55 : pressed ? 0.85 : 1,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.row}>
          {leading}
          {icon && <Ionicons name={icon} size={20} color={foreground} />}
          <AppText variant="button" style={{ color: foreground }}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(MIN_TOUCH, 54),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
