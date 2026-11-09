import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { AppText } from './app-text';

/** Pill segmented control (one choice from a few), e.g. theme or language in Settings. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const { colors, radii } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={[styles.segment, { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill }]}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.option,
                { borderRadius: radii.pill, backgroundColor: selected ? colors.primary : 'transparent' },
              ]}>
              <AppText variant="caption" style={{ color: selected ? colors.onPrimary : colors.text }}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', padding: 4 },
  option: { flex: 1, minHeight: MIN_TOUCH - 8, alignItems: 'center', justifyContent: 'center' },
});
