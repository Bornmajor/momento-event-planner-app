import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { SavedEventView } from '@/api/endpoints';
import { AppText } from '@/components/ui';
import { formatEventDate, formatVenue } from '@/features/events';
import { MIN_TOUCH } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/use-theme';

/**
 * One saved event (My Events): thumbnail, title, date in the user's time zone and venue, plus a remove button.
 * An event that's gone at the source shows as "Unavailable" and can only be removed.
 */
export const SavedEventRow = memo(function SavedEventRow({
  saved,
  inCalendar,
  onOpen,
  onRemove,
}: {
  saved: SavedEventView;
  inCalendar: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const event = saved.available ? saved.event : null;
  const venue = event ? formatVenue(event.venue) : null;

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg + 4, padding: spacing.sm, gap: spacing.md },
        !event && styles.dimmed,
      ]}>
      <Pressable
        onPress={event ? onOpen : undefined}
        disabled={!event}
        accessibilityRole="button"
        accessibilityLabel={event ? event.title : t('myEvents.unavailable')}
        style={[styles.main, { gap: spacing.md }]}>
        <View style={[styles.thumb, { borderRadius: radii.md, backgroundColor: colors.surfaceMuted }]}>
          {event?.imageUrl ? (
            <Image source={event.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : (
            <Ionicons name={event ? 'image-outline' : 'close-circle-outline'} size={24} color={colors.textMuted} />
          )}
        </View>
        <View style={[styles.flex, { gap: 4 }]}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {event?.title ?? t('myEvents.unavailable')}
          </AppText>
          {event ? (
            <>
              <AppText variant="caption" color="textMuted" numberOfLines={1}>
                {formatEventDate(event.start, i18n.language)}
              </AppText>
              {venue && (
                <AppText variant="caption" color="textMuted" numberOfLines={1}>
                  {venue}
                </AppText>
              )}
              {inCalendar && (
                <View style={styles.inline}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <AppText variant="caption" color="success">
                    {t('event.inCalendar')}
                  </AppText>
                </View>
              )}
            </>
          ) : (
            <AppText variant="caption" color="textMuted">
              {t('myEvents.unavailableHint')}
            </AppText>
          )}
        </View>
      </Pressable>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={t('myEvents.remove')}
        hitSlop={6}
        style={({ pressed }) => [styles.remove, { opacity: pressed ? 0.6 : 1 }]}>
        <Ionicons name="trash-outline" size={22} color={colors.danger} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  dimmed: { opacity: 0.7 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 76, height: 76, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  remove: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
});
