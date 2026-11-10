import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Category, CategoryId } from '../../domain/models/event';
import { AppText } from '@/components/ui';
import { MIN_TOUCH } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/use-theme';

/** Horizontal pill chips: "All" first, then the API's categories. The selected chip is filled with the brand colour. */
export function CategoryChips({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: CategoryId | null;
  onSelect: (id: CategoryId | null) => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const chips: { id: CategoryId | null; label: string }[] = [
    { id: null, label: t('explore.all') },
    ...categories.map((c) => ({ id: c.id, label: t(`categories.${c.id}`, { defaultValue: c.name }) })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xl }}
      accessibilityRole="tablist">
      {chips.map((chip) => (
        <Chip key={chip.id ?? 'all'} label={chip.label} active={chip.id === selected} onPress={() => onSelect(chip.id)} />
      ))}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        active
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <AppText variant="caption" style={[styles.label, { color: active ? colors.onPrimary : colors.text }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: MIN_TOUCH + 4, paddingHorizontal: 22, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '500' },
});
