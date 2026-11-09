import { Platform } from 'react-native';

/** Brand pink (logo, icons, highlights). Use `colors.primary` for buttons and text on light backgrounds. */
export const BRAND = '#EA4C89';

const light = {
  brand: BRAND,
  /** Darker pink: white text on it meets contrast (~5:1). */
  primary: '#C9356F',
  onPrimary: '#FFFFFF',
  background: '#F7F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEFF3',
  border: '#E2E2E6',
  text: '#111113',
  textMuted: '#60646C',
  danger: '#D93025',
  success: '#1E9E62',
  overlay: 'rgba(0,0,0,0.4)',
};

const dark: typeof light = {
  brand: BRAND,
  primary: BRAND,
  onPrimary: '#FFFFFF',
  background: '#111113',
  surface: '#1C1C1E',
  surfaceMuted: '#26262A',
  border: '#2E2E33',
  text: '#F5F5F7',
  textMuted: '#A1A1AA',
  danger: '#FF6B5E',
  success: '#3DD68C',
  overlay: 'rgba(0,0,0,0.6)',
};

export const colors = { light, dark };
export type ColorScheme = keyof typeof colors;
export type Colors = typeof light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radii = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

/**
 * Poppins, bundled by the expo-font config plugin. Android uses the font file name; iOS the PostScript name
 * (Expo fonts docs).
 */
export const fonts = Platform.select({
  ios: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semibold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
  },
  default: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
});

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 42 },
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 36 },
  heading: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 30 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
} as const;
export type TypographyVariant = keyof typeof typography;

/** Minimum touch target (spec §7 accessibility). */
export const MIN_TOUCH = 44;
