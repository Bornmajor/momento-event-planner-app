import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Event, EventSummary } from '@/api/endpoints';
import { ApiError, errorMessageKey } from '@/api/errors';
import { AppText, BackButton, Button, EmptyState, ErrorState, FormScreen, OfflineBanner } from '@/components/ui';
import { formatEventDate, formatVenue } from '@/features/events/format';
import { useEvent } from '@/features/events/use-events';
import { useTheme } from '@/theme/use-theme';

/**
 * Event details (first version): opens instantly from the list's data while the full event loads. Personalize and
 * Set reminder come next (plan.md 3.3–3.5).
 */
export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { colors, radii, spacing } = useTheme();
  const query = useEvent(id);
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
          <ErrorState message={t(errorMessageKey(query.error))} onRetry={() => void query.refetch()} />
        )}
      </FormScreen>
    );
  }

  const venue = formatVenue(event.venue);
  return (
    <FormScreen
      actions={
        <Button label={t('event.tickets')} icon="ticket-outline" onPress={() => void WebBrowser.openBrowserAsync(event.url)} />
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
      </View>
      <AppText variant="title" accessibilityRole="header">
        {event.title}
      </AppText>
      <View style={{ gap: spacing.sm }}>
        <Row icon="calendar-outline" text={formatEventDate(event.start, i18n.language)} />
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

function Row({ icon, text }: { icon: 'calendar-outline' | 'location-outline' | 'pricetag-outline'; text: string }) {
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
});
