import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { CategoryId } from '@/api/endpoints';
import { errorMessageKey } from '@/api/errors';
import { AppText, EmptyState, ErrorState, OfflineBanner, TextField } from '@/components/ui';
import { CategoryChips } from '@/features/events/components/category-chips';
import { EventCard } from '@/features/events/components/event-card';
import { ExploreHeader } from '@/features/events/components/explore-header';
import { useCategories, useEventSearch } from '@/features/events/use-events';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useTheme } from '@/theme/use-theme';

/** Explore (spec §6): greeting, title, search, category chips and the infinite list of upcoming events. */
export default function ExploreScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const q = useDebouncedValue(keyword, 400);

  const categories = useCategories();
  const search = useEventSearch({ q, category });
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
    </View>
  );

  const empty = search.isPending ? (
    <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xxxl }} />
  ) : search.isError ? (
    <ErrorState message={t(errorMessageKey(search.error))} onRetry={() => void search.refetch()} />
  ) : (
    <EmptyState
      icon="search-outline"
      title={t('explore.emptyTitle')}
      message={q || category ? t('explore.emptyFiltered') : t('explore.emptyAll')}
    />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <EventCard
              event={item}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
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
