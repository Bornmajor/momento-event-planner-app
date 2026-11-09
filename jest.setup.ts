// Test environment setup. EXPO_PUBLIC_* vars are inlined by Expo at build time; tests need a value.
process.env.EXPO_PUBLIC_API_URL = 'https://api.test/api/v1';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Reanimated needs native code, and its bundled mock still loads it in this version. A tiny mock of the APIs the
// app uses: animations jump straight to their end value.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: (style: () => object) => style(),
    withTiming: (value: unknown) => value,
  };
});

// Safe-area insets come from native code; the package ships a Jest mock with zero insets.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Network status (OfflineBanner) comes from native code; use the mock NetInfo ships.
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));
