import Ionicons from '@expo/vector-icons/Ionicons';
import { useNetInfo } from '@react-native-community/netinfo';
import type { ComponentProps, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/use-theme';

import { AppText } from './app-text';
import { Button } from './button';

/** Screen container: safe area, themed background, optional scrolling. */
export function Screen({
  children,
  scroll = false,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  const { colors, spacing } = useTheme();
  const content = [{ padding: spacing.xl, gap: spacing.lg }, style];
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.grow, ...content]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, ...content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

function Message({
  icon,
  title,
  message,
  action,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.center, { gap: spacing.md, padding: spacing.xl }]}>
      <Ionicons name={icon} size={40} color={colors.textMuted} />
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {message && (
        <AppText color="textMuted" align="center">
          {message}
        </AppText>
      )}
      {action && <Button label={action.label} onPress={action.onPress} variant="outline" />}
    </View>
  );
}

export function EmptyState(props: { icon?: ComponentProps<typeof Ionicons>['name']; title: string; message?: string }) {
  return <Message icon={props.icon ?? 'calendar-outline'} title={props.title} message={props.message} />;
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <Message
      icon="alert-circle-outline"
      title={t('common.somethingWrong')}
      message={message}
      action={onRetry && { label: t('common.retry'), onPress: onRetry }}
    />
  );
}

/** Thin banner shown while the device has no connection (spec §5.2). */
export function OfflineBanner() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { isConnected } = useNetInfo();
  if (isConnected !== false) return null;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.surfaceMuted, paddingVertical: spacing.sm, gap: spacing.sm }]}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.textMuted} />
      <AppText variant="caption" color="textMuted">
        {t('common.offline')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
