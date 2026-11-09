import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EventSummary } from '@/api/endpoints';
import { AppText } from '@/components/ui';
import { MIN_TOUCH } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { formatEventDate, formatVenue } from '../format';

/** Statuses worth flagging on the card (on sale / unknown show nothing). */
const FLAGGED = new Set(['cancelled', 'postponed', 'rescheduled', 'offsale']);

/**
 * Explore event card (reference design): title and details on top with a pill "Details" button, a large rounded
 * image underneath. The whole card opens the event.
 */
export const EventCard = memo(function EventCard({ event, onPress }: { event: EventSummary; onPress: () => void }) {
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const venue = formatVenue(event.venue);
  const date = formatEventDate(event.start, i18n.language);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[event.title, date, venue].filter(Boolean).join(', ')}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, padding: spacing.sm, opacity: pressed ? 0.92 : 1 },
      ]}>
      <View style={[styles.top, { padding: spacing.sm, gap: spacing.md }]}>
        <View style={[styles.flex, { gap: 6 }]}>
          <AppText variant="bodyStrong" numberOfLines={2} style={styles.title}>
            {event.title}
          </AppText>
          <Meta icon="calendar-outline" text={date} />
          {venue && <Meta icon="location-outline" text={venue} />}
        </View>
        <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <AppText variant="caption" style={styles.pillLabel}>
            {t('explore.details')}
          </AppText>
        </View>
      </View>
      <View style={[styles.imageWrap, { borderRadius: radii.lg + 4, backgroundColor: colors.surfaceMuted }]}>
        {event.imageUrl ? (
          <Image source={event.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name="image-outline" size={40} color={colors.textMuted} />
        )}
        {FLAGGED.has(event.status) && (
          <View style={[styles.badge, { backgroundColor: colors.danger, borderRadius: radii.pill }]}>
            <AppText variant="caption" style={styles.badgeLabel}>
              {t(`event.status.${event.status}`)}
            </AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
});

function Meta({ icon, text }: { icon: 'calendar-outline' | 'location-outline'; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <AppText variant="caption" color="textMuted" numberOfLines={1} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, borderWidth: StyleSheet.hairlineWidth },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  flex: { flex: 1 },
  title: { fontSize: 17, lineHeight: 24 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  pillLabel: { fontWeight: '600' },
  imageWrap: { height: 200, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeLabel: { color: '#FFFFFF', fontWeight: '700' },
});
