import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import type { ComponentProps } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

interface Tile {
  /** Position and size as fractions of the collage width/height. */
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: string;
  color: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** A photo for this slot. Without one, the illustrated tile is shown. */
  image?: ImageSource;
}

/**
 * Tilted event tiles. Each slot takes an optional photo (design/README.md: 5–6 free-licence event photos);
 * until photos are added, brand-coloured illustrated tiles fill the slots.
 */
const TILES: Tile[] = [
  { x: -0.08, y: 0.02, w: 0.5, h: 0.36, rotate: '-8deg', color: '#EA4C89', icon: 'musical-notes' },
  { x: 0.48, y: -0.04, w: 0.52, h: 0.4, rotate: '7deg', color: '#7C5CFC', icon: 'color-palette' },
  { x: 0.16, y: 0.36, w: 0.46, h: 0.4, rotate: '-4deg', color: '#FF8A4C', icon: 'sparkles' },
  { x: -0.14, y: 0.64, w: 0.4, h: 0.32, rotate: '6deg', color: '#22B8A7', icon: 'football' },
  { x: 0.62, y: 0.42, w: 0.46, h: 0.36, rotate: '-7deg', color: '#C9356F', icon: 'film' },
];

/** Number of bands in the fade; each is a step more opaque, so the collage melts into the background. */
const FADE_STEPS = 10;

export function WelcomeCollage({ height }: { height: number }) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const fadeHeight = height * 0.45;

  return (
    <View style={[styles.container, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {TILES.map((tile, index) => (
        <View
          key={index}
          style={[
            styles.tile,
            {
              left: tile.x * width,
              top: tile.y * height,
              width: tile.w * width,
              height: tile.h * height,
              backgroundColor: tile.color,
              transform: [{ rotate: tile.rotate }],
            },
          ]}>
          {tile.image ? (
            <Image source={tile.image} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Ionicons name={tile.icon} size={Math.round(width * 0.14)} color="rgba(255,255,255,0.9)" />
          )}
        </View>
      ))}
      <View style={[styles.fade, { height: fadeHeight }]} pointerEvents="none">
        {Array.from({ length: FADE_STEPS }, (_, i) => (
          <View
            key={i}
            style={{ flex: 1, backgroundColor: colors.background, opacity: (i + 1) / FADE_STEPS }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  tile: {
    position: 'absolute',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
