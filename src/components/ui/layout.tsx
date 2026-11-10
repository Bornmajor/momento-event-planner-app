import Ionicons from '@expo/vector-icons/Ionicons';
import { useNetInfo } from '@react-native-community/netinfo';
import type { ComponentProps, ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme/use-theme';

import { AppText } from './app-text';
import { Button } from './button';

const ALL_EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];

/**
 * Screen container: safe area, themed background, optional scrolling. Pass edges without 'top' when a layout above
 * already handles the notch (e.g. the Sign Up progress header).
 */
export function Screen({
  children,
  scroll = false,
  style,
  edges = ALL_EDGES,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  edges?: Edge[];
}) {
  const { colors, spacing } = useTheme();
  const content = [{ padding: spacing.xl, gap: spacing.lg }, style];
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: colors.background }]}>
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

/**
 * Layout for every form screen (app-wide UX rule): the fields scroll, and the actions (main button, then links such
 * as "Already have an account? Sign In") stay pinned to the bottom of the screen, above the keyboard and the home
 * indicator. Android is edge-to-edge, so the window doesn't resize for the keyboard; KeyboardAvoidingView with
 * "padding" lifts the actions on both platforms (Expo keyboard-handling guide).
 */
export function FormScreen({
  children,
  actions,
  edges = ALL_EDGES,
}: {
  children: ReactNode;
  /** Pinned at the bottom: the primary button first, then secondary links. */
  actions: ReactNode;
  edges?: Edge[];
}) {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.fill}>
        <ScrollView
          contentContainerStyle={[styles.grow, { padding: spacing.xl, gap: spacing.lg }]}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: spacing.xs }}>
          {actions}
        </View>
      </KeyboardAvoidingView>
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
