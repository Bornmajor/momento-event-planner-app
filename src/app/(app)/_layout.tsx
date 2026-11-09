import { Stack } from 'expo-router';

/** Signed-in area: the tabs, plus screens pushed on top of them (event details, personalize). */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="events/[id]" />
      <Stack.Screen name="events/[id]/personalize" />
    </Stack>
  );
}
