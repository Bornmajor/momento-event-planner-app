import { Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { useSession } from '@/features/auth/session';

import Index from '@/app/index';

jest.mock('@/features/auth/session', () => {
  const { create } = jest.requireActual('zustand');
  return { useSession: create(() => ({ status: 'restoring', accessToken: null, userId: null })) };
});

/** Same guard structure as the real root layout, with stand-in screens. */
function Layout() {
  const signedIn = useSession((s: { status: string }) => s.status) === 'signedIn';
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Protected guard={signedIn} redirectTo="/welcome">
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn} redirectTo="/home">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

const routes = {
  _layout: Layout,
  index: Index,
  '(auth)/welcome': () => <Text>Welcome screen</Text>,
  '(app)/home': () => <Text>Home screen</Text>,
};

describe('start route "/"', () => {
  it('opens the welcome screen when signed out', async () => {
    useSession.setState({ status: 'signedOut' });
    await renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByText('Welcome screen')).toBeOnTheScreen();
  });

  it('opens home when signed in', async () => {
    useSession.setState({ status: 'signedIn' });
    await renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByText('Home screen')).toBeOnTheScreen();
  });
});
