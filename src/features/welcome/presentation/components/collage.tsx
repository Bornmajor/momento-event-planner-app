import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/use-theme';

/**
 * Welcome photo collage (design/README.md). The image carries its own soft fade and a transparent background,
 * so it sits on the light and dark theme backgrounds alike.
 */
const COLLAGE = require('@/assets/images/welcome-collage.png');

/**
 * Soft fade over the bottom of the collage (reference design): tall but gentle, so the bottom photos stay mostly
 * visible (about 70–80% through the middle of the fade) and only melt fully into the background at the very edge.
 * Built from thin bands of the background colour, so no gradient library is needed.
 */
const FADE_STEPS = 40;
const FADE_HEIGHT = '42%';
/** Eased curve: opacity stays low for most of the fade, then rises fast near the bottom (0.18 halfway, 1 at the edge). */
const fadeOpacity = (i: number) => Math.pow((i + 1) / FADE_STEPS, 2.5);

export function WelcomeCollage() {
  const { colors } = useTheme();
  return (
    <View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={COLLAGE} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
      <View style={styles.fade} pointerEvents="none">
        {Array.from({ length: FADE_STEPS }, (_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: colors.background, opacity: fadeOpacity(i) }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: FADE_HEIGHT },
});
