import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui';
import { useTheme } from '@/core/theme/use-theme';

import type { EventWhen } from '../use-events';

export interface WhenSelection {
  now: boolean;
  upcoming: boolean;
}

/** Both ticked → all; one → that one. At least one always stays ticked (see onToggle). */
export function toWhen(selection: WhenSelection): EventWhen {
  if (selection.now && selection.upcoming) return 'all';
  return selection.now ? 'now' : 'upcoming';
}

/**
 * "Happening now" and "Upcoming" checkboxes under the category pills. Unticking the last ticked box is ignored, so
 * the list never filters everything out.
 */
export function WhenFilter({ value, onChange }: { value: WhenSelection; onChange: (next: WhenSelection) => void }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  const toggle = (key: keyof WhenSelection) => (checked: boolean) => {
    const next = { ...value, [key]: checked };
    if (!next.now && !next.upcoming) return;
    onChange(next);
  };

  return (
    <View style={[styles.row, { paddingHorizontal: spacing.xl, gap: spacing.xl }]}>
      <Checkbox checked={value.now} onChange={toggle('now')} label={t('explore.happeningNow')} />
      <Checkbox checked={value.upcoming} onChange={toggle('upcoming')} label={t('explore.upcoming')} />
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' } });
