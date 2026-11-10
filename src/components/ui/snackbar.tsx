import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { MIN_TOUCH } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/use-theme';

import { AppText } from './app-text';

export type SnackbarTone = 'success' | 'error' | 'info';

interface Snack {
  id: number;
  message: string;
  tone: SnackbarTone;
  action?: { label: string; onPress: () => void };
}

/** current: what's showing. last: kept after hiding so the snackbar can fade out with its text. */
const useSnackbarStore = create<{ current: Snack | null; last: Snack | null }>(() => ({ current: null, last: null }));

let nextId = 1;

/**
 * App-wide feedback (spec: snackbar for feedback). Messages are already translated; one shows at a time and a new
 * one replaces the old. Rendered by <SnackbarHost /> in the root layout.
 */
export const snackbar = {
  show(message: string, options: { tone?: SnackbarTone; action?: Snack['action'] } = {}) {
    const snack: Snack = { id: nextId++, message, tone: options.tone ?? 'info', action: options.action };
    useSnackbarStore.setState({ current: snack, last: snack });
  },
  success: (message: string, action?: Snack['action']) => snackbar.show(message, { tone: 'success', action }),
  error: (message: string, action?: Snack['action']) => snackbar.show(message, { tone: 'error', action }),
  hide: () => useSnackbarStore.setState({ current: null }),
};

const ICONS = { success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle' } as const;
/** Errors stay a little longer so there's time to read them. */
const DURATION_MS = { success: 3500, info: 3500, error: 6000 } as const;

/** Bottom snackbar, kept above the home indicator and the keyboard. */
export function SnackbarHost() {
  const current = useSnackbarStore((s) => s.current);
  const { colors, radii, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const visible = useSnackbarStore((s) => s.last);
  const shown = useSharedValue(0);

  useEffect(() => {
    if (!current) {
      shown.value = withTiming(0, { duration: 180 });
      return;
    }
    shown.value = withTiming(1, { duration: 220 });
    AccessibilityInfo.announceForAccessibility(current.message);
    const timer = setTimeout(snackbar.hide, DURATION_MS[current.tone]);
    return () => clearTimeout(timer);
  }, [current, shown]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * 24 }],
  }));

  if (!visible) return null;
  const accent = visible.tone === 'error' ? colors.danger : visible.tone === 'success' ? colors.success : colors.brand;

  return (
    <Animated.View
      pointerEvents={current ? 'box-none' : 'none'}
      style={[
        styles.host,
        { bottom: Math.max(insets.bottom, keyboard) + spacing.lg, left: spacing.lg, right: spacing.lg },
        animatedStyle,
      ]}>
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[
          styles.snack,
          { backgroundColor: colors.text, borderRadius: radii.md, paddingHorizontal: spacing.lg, gap: spacing.md },
        ]}>
        <Ionicons name={ICONS[visible.tone]} size={20} color={accent} />
        <AppText variant="caption" style={[styles.message, { color: colors.background }]}>
          {visible.message}
        </AppText>
        {visible.action && (
          <Pressable
            onPress={() => {
              visible.action?.onPress();
              snackbar.hide();
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.action}>
            <AppText variant="caption" style={[styles.actionLabel, { color: colors.brand }]}>
              {visible.action.label}
            </AppText>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

const styles = StyleSheet.create({
  host: { position: 'absolute' },
  snack: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  message: { flex: 1 },
  action: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  actionLabel: { fontWeight: '700' },
});
