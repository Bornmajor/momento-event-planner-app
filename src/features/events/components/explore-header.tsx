import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { useMe } from '@/features/profile/use-me';
import { fonts, MIN_TOUCH } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/**
 * Explore top section (reference design): avatar with "Hello, name" and a round search button, then the big
 * two-line title with "the Events" emphasised. No profile photos in Version 1, so the avatar shows initials.
 */
export function ExploreHeader({ searchOpen, onToggleSearch }: { searchOpen: boolean; onToggleSearch: () => void }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { data: user } = useMe();
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '·';

  return (
    <View style={{ gap: spacing.xl, paddingHorizontal: spacing.xl }}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: colors.brand }]} accessibilityElementsHidden>
          <AppText variant="bodyStrong" style={{ color: colors.onPrimary }}>
            {initials}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="caption" color="textMuted">
            {t('explore.hello')}
          </AppText>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {user ? `${user.firstName} ${user.lastName}`.trim() : ' '}
          </AppText>
        </View>
        <Pressable
          onPress={onToggleSearch}
          accessibilityRole="button"
          accessibilityLabel={searchOpen ? t('explore.closeSearch') : t('explore.search')}
          style={({ pressed }) => [
            styles.round,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name={searchOpen ? 'close' : 'search'} size={22} color={colors.text} />
        </Pressable>
      </View>
      <View accessibilityRole="header">
        <AppText style={[styles.titleLine, { fontFamily: fonts.regular, color: colors.text }]}>
          {t('explore.titleTop')}
        </AppText>
        <AppText style={[styles.titleLine, { fontFamily: fonts.regular, color: colors.text }]}>
          {t('explore.titleLead')}{' '}
          <AppText style={[styles.titleLine, { fontFamily: fonts.bold, color: colors.brand }]}>
            {t('explore.titleEmphasis')}
          </AppText>
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  round: {
    width: MIN_TOUCH + 8,
    height: MIN_TOUCH + 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine: { fontSize: 32, lineHeight: 42 },
});
