import { useEffect } from 'react';
import { StyleSheet, View, type AccessibilityProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/core/theme/use-theme';

interface SegmentedBarProps extends Pick<AccessibilityProps, 'accessibilityLabel' | 'accessibilityValue'> {
  /** Number of segments, e.g. 2 onboarding steps or 4 strength levels. */
  segments: number;
  /** How many segments are filled (0..segments). */
  filled: number;
  color: string;
  height?: number;
}

/** A linear bar split into segments that fill in turn (onboarding progress, password strength). */
export function SegmentedBar({ segments, filled, color, height = 6, ...a11y }: SegmentedBarProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={a11y.accessibilityValue ?? { min: 0, max: segments, now: filled }}
      accessibilityLabel={a11y.accessibilityLabel}
      style={styles.row}>
      {Array.from({ length: segments }, (_, i) => (
        <Segment key={i} on={i < filled} color={color} height={height} />
      ))}
    </View>
  );
}

function Segment({ on, color, height }: { on: boolean; color: string; height: number }) {
  const { colors } = useTheme();
  const progress = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(on ? 1 : 0, { duration: 250 });
  }, [on, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.surfaceMuted }]}>
      <Animated.View style={[styles.fill, { borderRadius: height / 2, backgroundColor: color }, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  track: { flex: 1, overflow: 'hidden' },
  fill: { height: '100%' },
});
