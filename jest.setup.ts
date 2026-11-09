// Test environment setup. EXPO_PUBLIC_* vars are inlined by Expo at build time; tests need a value.
process.env.EXPO_PUBLIC_API_URL = 'https://api.test/api/v1';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
