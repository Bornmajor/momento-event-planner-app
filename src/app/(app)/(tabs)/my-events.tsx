import { useNetInfo } from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { SavedEventView } from '@/api/endpoints';
import { failureMessage } from '@/core/failures';
import { AppText, EmptyState, ErrorState, OfflineBanner } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { useCalendarEntries } from '@/features/saved-events/calendar-entries';
import { useSavedEvents } from '@/features/saved-events/mutations';
import { SavedEventRow } from '@/features/saved-events/saved-event-row';
import { useRemoveEvent } from '@/features/saved-events/use-remove-event';
import { useTheme } from '@/core/theme/use-theme';

/**
 * My Events (spec §6): saved events, newest first. Opens offline from the copy kept on the phone, refreshes when
 * online, and removes optimistically (queued while offline).
 */
export default function MyEventsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, spacing } = useTheme();
  const { isConnected } = useNetInfo();
  const saved = useSavedEvents();
  const removeEvent = useRemoveEvent();
  const userId = useSession((s) => s.userId);
  const calendarIds = useCalendarEntries((s) => (userId ? s.byUser[userId] : undefined));
  const items = saved.data ?? [];

  const confirmRemove = (item: SavedEventView) =>
    Alert.alert(t('myEvents.removeTitle'), t('myEvents.removeBody', { title: item.event?.title ?? t('myEvents.unavailable') }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('myEvents.remove'), style: 'destructive', onPress: () => removeEvent(item.eventId) },
    ]);

  const lastUpdated =
    saved.dataUpdatedAt > 0
      ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(saved.dataUpdatedAt)
      : null;

  const header = (
    <View style={{ gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg }}>
      <OfflineBanner />
      <AppText variant="title" accessibilityRole="header">
        {t('tabs.myEvents')}
      </AppText>
      <AppText color="textMuted">
        {items.length > 0 ? t('myEvents.count', { count: items.length }) : t('myEvents.subtitle')}
      </AppText>
      {isConnected === false && lastUpdated && (
        <AppText variant="caption" color="textMuted">
          {t('myEvents.lastUpdated', { when: lastUpdated })}
        </AppText>
      )}
    </View>
  );

  const empty = saved.isPending ? (
    // Offline with nothing kept on the phone yet: the fetch is paused, not failed.
    isConnected === false ? (
      <EmptyState icon="cloud-offline-outline" title={t('myEvents.offlineEmptyTitle')} message={t('myEvents.offlineEmptyBody')} />
    ) : (
      <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xxxl }} />
    )
  ) : saved.isError ? (
    <ErrorState message={t(failureMessage(saved.error))} onRetry={() => void saved.refetch()} />
  ) : (
    <EmptyState icon="bookmark-outline" title={t('myEvents.emptyTitle')} message={t('myEvents.emptyBody')} />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.eventId}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <SavedEventRow
              saved={item}
              inCalendar={Boolean(calendarIds?.[item.eventId])}
              onOpen={() => router.push({ pathname: '/events/[id]', params: { id: item.eventId } })}
              onRemove={() => confirmRemove(item)}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={saved.isRefetching}
            onRefresh={() => void saved.refetch()}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
