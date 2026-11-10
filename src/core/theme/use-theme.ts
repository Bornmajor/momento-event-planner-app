import { useColorScheme } from 'react-native';

import { colors, radii, spacing, typography, type ColorScheme } from './tokens';

/** The current theme. Follows the system unless the user picked Light or Dark (see theme-store). */
export function useTheme() {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: colors[scheme], spacing, radii, typography };
}

export type Theme = ReturnType<typeof useTheme>;
