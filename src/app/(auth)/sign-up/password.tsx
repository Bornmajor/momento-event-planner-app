import { Redirect } from 'expo-router';

import { OfflineBanner, Screen } from '@/components/ui';
import { PasswordStep } from '@/features/auth/components/sign-up-steps';
import { useSignUpDraft } from '@/features/auth/sign-up-draft';

/** Sign Up step 2 of 2: password and confirmation. Without step 1's details (e.g. after a reload), go back to it. */
export default function SignUpPasswordScreen() {
  const details = useSignUpDraft((s) => s.details);
  if (!details) return <Redirect href="/sign-up" />;
  return (
    <Screen scroll edges={['bottom', 'left', 'right']}>
      <OfflineBanner />
      <PasswordStep details={details} />
    </Screen>
  );
}
