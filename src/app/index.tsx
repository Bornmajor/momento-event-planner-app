import { Redirect } from 'expo-router';

import { useSession } from '@/features/auth';

/**
 * The app's start URL ("/"). Not behind a guard, so it always resolves: signed-out users go to the welcome screen,
 * signed-in users to the signed-in home. While the session is still restoring, the splash screen covers this.
 */
export default function Index() {
  const status = useSession((s) => s.status);
  if (status === 'restoring') return null;
  return <Redirect href={status === 'signedIn' ? '/home' : '/welcome'} />;
}
