import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Event, EventSummary } from '@/api/endpoints';
import { ApiError } from '@/core/api/api-error';
import { failureMessage } from '@/core/failures';
import { AppText, BackButton, Button, EmptyState, ErrorState, FormScreen, OfflineBanner } from '@/components/ui';
import { formatEventDate, formatVenue, formatVenueTime } from '@/features/events/format';
import { useEvent } from '@/features/events/use-events';
import { useSession } from '@/features/auth/session';
import { useCalendarEntries } from '@/features/saved-events/calendar-entries';
import { useTheme } from '@/core/theme/use-theme';

/** Statuses shown as a badge on the image (on sale / unknown show nothing). */
const FLAGGED = new Set(['cancelled', 'postponed', 'rescheduled', 'offsale']);

/**
 * Event details (spec §6): opens instantly from the list's data while the full event loads. Set reminder leads to
 * Personalize; Get Tickets opens Ticketmaster. Dates are the venue's local time.
 */
export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const query = useEvent(id);
  const userId = useSession((s) => s.userId);
  const inCalendar = useCalendarEntries((s) => Boolean(userId && s.byUser[userId]?.[id]));
  const event = query.data as (EventSummary & Partial<Pick<Event, 'description' | 'notes'>>) | undefined;

  if (!event) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <FormScreen actions={null}>
        <BackButton />
        {query.isPending ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xxxl }} />
        ) : notFound ? (
          <EmptyState icon="calendar-outline" title={t('event.notFound')} />
        ) : (
          <ErrorState message={t(failureMessage(query.error))} onRetry={() => void query.refetch()} />
        )}
      </FormScreen>
    );
  }

  const venue = formatVenue(event.venue);
  return (
    <FormScreen
      actions={
        <>
          <Button
            label={inCalendar ? t('event.updateReminder') : t('event.setReminder')}
            icon="alarm-outline"
            onPress={() => router.push({ pathname: '/events/[id]/personalize', params: { id: event.id } })}
            disabled={event.status === 'cancelled'}
          />
          <Button
            label={t('event.tickets')}
            variant="outline"
            icon="ticket-outline"
            onPress={() => void WebBrowser.openBrowserAsync(event.url)}
          />
        </>
      }>
      <OfflineBanner />
      <View style={[styles.hero, { borderRadius: radii.lg + 8, backgroundColor: colors.surfaceMuted }]}>
        {event.imageUrl ? (
          <Image source={event.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name="image-outline" size={48} color={colors.textMuted} />
        )}
        <View style={[styles.back, { margin: spacing.md }]}>
          <BackButton />
        </View>
        {FLAGGED.has(event.status) && (
          <View style={[styles.badge, { backgroundColor: colors.danger, borderRadius: radii.pill, margin: spacing.md }]}>
            <AppText variant="caption" style={styles.badgeLabel}>
              {t(`event.status.${event.status}`)}
            </AppText>
          </View>
        )}
      </View>
      <AppText variant="title" accessibilityRole="header">
        {event.title}
      </AppText>
      <View style={{ gap: spacing.sm }}>
        <Row icon="calendar-outline" text={formatEventDate(event.start, i18n.language)} />
        {formatVenueTime(event.start, i18n.language) && event.start.timezone && (
          <AppText variant="caption" color="textMuted" style={styles.indent}>
            {t('event.venueTime', {
              time: formatVenueTime(event.start, i18n.language),
              zone: event.start.timezone.replace(/_/g, ' '),
            })}
          </AppText>
        )}
        {inCalendar && <Row icon="checkmark-circle-outline" text={t('event.inCalendar')} />}
        {venue && <Row icon="location-outline" text={venue} />}
        {event.category && <Row icon="pricetag-outline" text={t(`categories.${event.category.id}`)} />}
      </View>
      {event.description !== undefined ? (
        <AppText color="textMuted">{event.description || event.notes || t('event.noDescription')}</AppText>
      ) : (
        <ActivityIndicator color={colors.brand} />
      )}
    </FormScreen>
  );
}

function Row({
  icon,
  text,
}: {
  icon: 'calendar-outline' | 'location-outline' | 'pricetag-outline' | 'checkmark-circle-outline';
  text: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.brand} />
      <AppText style={styles.flex}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 260, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  back: { position: 'absolute', top: 0, left: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  indent: { marginLeft: 28, marginTop: -6 },
  badge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 12, paddingVertical: 6 },
  badgeLabel: { color: '#FFFFFF', fontWeight: '700' },
});
