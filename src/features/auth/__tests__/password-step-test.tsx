import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/api/errors';
import { SnackbarHost } from '@/components/ui';
import '@/lib/i18n';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('@/api/endpoints', () => ({ authApi: { register: jest.fn() } }));
jest.mock('@/features/auth/session', () => ({ startSession: jest.fn(), onSessionEnd: jest.fn() }));

// eslint-disable-next-line import/first -- mocks must be registered first
import { router } from 'expo-router';
// eslint-disable-next-line import/first
import { authApi } from '@/api/endpoints';
// eslint-disable-next-line import/first
import { PasswordStep } from '../components/sign-up-steps';
// eslint-disable-next-line import/first
import { useSignUpDraft } from '../sign-up-draft';

const register = authApi.register as jest.Mock;
const details = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };

async function renderStep() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  await render(
    <QueryClientProvider client={client}>
      <PasswordStep details={details} />
      <SnackbarHost />
    </QueryClientProvider>,
  );
}

async function submit(password: string, confirm: string) {
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
  await fireEvent.changeText(screen.getByLabelText('Confirm password'), confirm);
  await fireEvent.press(screen.getByRole('button', { name: 'Create Account' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  useSignUpDraft.getState().reset();
});

describe('Sign Up password step', () => {
  it('rejects guessable passwords and a mismatched confirmation', async () => {
    await renderStep();
    await submit('Ada12345', 'Ada12345x');

    expect(await screen.findByText('This password is too easy to guess. Try a longer one.')).toBeOnTheScreen();
    expect(screen.getByText("Passwords don't match.")).toBeOnTheScreen();
    expect(screen.getByText('Weak')).toBeOnTheScreen();
    expect(register).not.toHaveBeenCalled();
  });

  it('creates the account with the details from step 1', async () => {
    register.mockResolvedValue({ user: { id: 'u1' }, accessToken: 'a', refreshToken: 'r' });
    await renderStep();
    await submit('violet-harbor-lantern-42', 'violet-harbor-lantern-42');

    await waitFor(() => expect(register).toHaveBeenCalledWith({ ...details, password: 'violet-harbor-lantern-42' }));
    expect(await screen.findByText('Welcome to Momento, Ada!')).toBeOnTheScreen();
  });

  it('sends the user back to step 1 when the email is taken', async () => {
    register.mockRejectedValue(new ApiError(409, 'EMAIL_TAKEN', 'Email taken'));
    await renderStep();
    await submit('violet-harbor-lantern-42', 'violet-harbor-lantern-42');

    expect(await screen.findByText('An account with this email already exists.')).toBeOnTheScreen();
    expect(useSignUpDraft.getState().emailError).toBe('errors.EMAIL_TAKEN');
    expect(router.back).toHaveBeenCalled();
  });
});
