import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MIN_TOUCH } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/use-theme';

import { AppText } from './app-text';

/** Round back button, top-left of auth screens. */
export function BackButton({ onPress }: { onPress?: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.back')}
      style={({ pressed }) => [
        styles.round,
        { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
      ]}>
      <Ionicons name="chevron-back" size={22} color={colors.text} />
    </Pressable>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  const { colors, radii } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.checkboxRow}>
      <View
        style={[
          styles.box,
          {
            borderRadius: radii.sm / 2,
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : colors.surface,
          },
        ]}>
        {checked && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
      </View>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
    </Pressable>
  );
}

/** Horizontal rule with centred text ("or continue with"). */
export function Divider({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dividerRow} accessibilityRole={label ? 'text' : undefined}>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      {label && (
        <AppText variant="caption" color="textMuted">
          {label}
        </AppText>
      )}
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  round: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: MIN_TOUCH },
  box: { width: 20, height: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
