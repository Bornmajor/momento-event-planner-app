import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, EmptyState, ErrorState, OfflineBanner, TextField } from '@/components/ui';
import { failureMessage } from '@/core/failures';
import { useDebouncedValue } from '@/core/hooks/use-debounced-value';
import { useTheme } from '@/core/theme/use-theme';

import type { CategoryId } from '../../domain/models/event';
import { CategoryChips } from '../components/category-chips';
import { EventCard } from '../components/event-card';
import { ExploreHeader } from '../components/explore-header';
import { toWhen, WhenFilter, type WhenSelection } from '../components/when-filter';
import { useCategories } from '../hooks/use-categories';
import { useEventSearch } from '../hooks/use-event-search';

// Defined once, outside the screen: the cards are memoized, so the list must hand them the same function and the
// same separator component on every render, or every visible card re-renders (VirtualizedList "slow to update").
const openEvent = (id: string) => router.push({ pathname: '/events/[id]', params: { id } });

function Separator() {
  const { spacing } = useTheme();
  return <View style={{ height: spacing.lg }} />;
}

/** Explore (spec §6): greeting, title, search, category chips and the infinite list of upcoming events. */
export function ExploreScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [timing, setTiming] = useState<WhenSelection>({ now: true, upcoming: true });
  const when = toWhen(timing);
  const q = useDebouncedValue(keyword, 400);

  const categories = useCategories();
  const search = useEventSearch({ q, category, when });
  const events = search.data?.pages.flatMap((page) => page.items) ?? [];

  const toggleSearch = () => {
    if (searchOpen) setKeyword('');
    setSearchOpen((open) => !open);
  };

  const header = (
    <View style={{ gap: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
      <OfflineBanner />
      <ExploreHeader searchOpen={searchOpen} onToggleSearch={toggleSearch} />
      {searchOpen && (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <TextField
            label={t('explore.searchPlaceholder')}
            icon="search-outline"
            value={keyword}
            onChangeText={setKeyword}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>
      )}
      <CategoryChips categories={categories.data ?? []} selected={category} onSelect={setCategory} />
      <WhenFilter value={timing} onChange={setTiming} />
    </View>
  );

  const empty = search.isPending ? (
    <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xxxl }} />
  ) : search.isError ? (
    <ErrorState message={t(failureMessage(search.error))} onRetry={() => void search.refetch()} />
  ) : (
    <EmptyState
      icon="search-outline"
      title={t('explore.emptyTitle')}
      message={
        when === 'now' && !q && !category
          ? t('explore.emptyNow')
          : q || category
            ? t('explore.emptyFiltered')
            : t('explore.emptyAll')
      }
    />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <EventCard event={item} onPress={openEvent} />
          </View>
        )}
        ItemSeparatorComponent={Separator}
        // Cards are tall (~300 dp), so a few per batch fill the screen; fewer rows mounted at once.
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={7}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={{ marginBottom: spacing.md }}
        ListEmptyComponent={empty}
        ListFooterComponent={
          search.isFetchingNextPage ? (
            <ActivityIndicator color={colors.brand} style={{ margin: spacing.xl }} />
          ) : events.length > 0 && !search.hasNextPage ? (
            <AppText variant="caption" color="textMuted" align="center" style={{ margin: spacing.xl }}>
              {t('explore.endOfList')}
            </AppText>
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        onEndReached={() => {
          if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={search.isRefetching && !search.isFetchingNextPage}
            onRefresh={() => void search.refetch()}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
