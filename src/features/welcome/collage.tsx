import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

/**
 * Welcome photo collage (design/README.md). The image carries its own soft fade and a transparent background,
 * so it sits on the light and dark theme backgrounds alike.
 */
const COLLAGE = require('../../../assets/images/welcome-collage.png');

/** A short fade only where the screen is too short to show the whole collage and its bottom gets cropped. */
const FADE_STEPS = 4;

export function WelcomeCollage() {
  const { colors } = useTheme();
  return (
    <View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={COLLAGE} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
      <View style={styles.fade} pointerEvents="none">
        {Array.from({ length: FADE_STEPS }, (_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: colors.background, opacity: (i + 1) / (FADE_STEPS + 1) }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 24 },
});
