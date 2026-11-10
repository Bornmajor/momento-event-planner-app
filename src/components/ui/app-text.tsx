import { Text, type TextProps } from 'react-native';

import type { Colors, TypographyVariant } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/use-theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof Colors;
  align?: 'left' | 'center' | 'right';
}

/** Themed text. Scales with the system font size (allowFontScaling is on by default). */
export function AppText({ variant = 'body', color = 'text', align, style, ...rest }: AppTextProps) {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[typography[variant], { color: colors[color] }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}
