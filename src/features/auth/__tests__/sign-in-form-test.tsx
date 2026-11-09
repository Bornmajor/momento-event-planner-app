import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/api/errors';
import { SnackbarHost } from '@/components/ui';
import '@/lib/i18n';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('@/api/endpoints', () => ({ authApi: { login: jest.fn() } }));
jest.mock('@/features/auth/session', () => ({ startSession: jest.fn() }));

// eslint-disable-next-line import/first -- mocks must be registered first
import { authApi } from '@/api/endpoints';
// eslint-disable-next-line import/first
import { startSession } from '@/features/auth/session';
// eslint-disable-next-line import/first
import { SignInForm } from '../components/sign-in-form';

const login = authApi.login as jest.Mock;

async function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  await render(
    <QueryClientProvider client={client}>
      <SignInForm />
      <SnackbarHost />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('SignInForm', () => {
  it('shows field errors and does not call the API for invalid input', async () => {
    await renderForm();
    await fireEvent.changeText(screen.getByLabelText('Email'), 'not-an-email');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeOnTheScreen();
    expect(screen.getByText('Enter your password.')).toBeOnTheScreen();
    expect(login).not.toHaveBeenCalled();
  });

  it('signs in with the normalised email and starts a remembered session', async () => {
    const result = { user: { id: 'u1' }, accessToken: 'a', refreshToken: 'r' };
    login.mockResolvedValue(result);
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Email'), '  Ada@Example.com ');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'Passw0rd!');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'Passw0rd!' }));
    await waitFor(() => expect(startSession).toHaveBeenCalledWith(result, true));
  });

  it('shows the translated message when the credentials are wrong', async () => {
    login.mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'));
    await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Email'), 'ada@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'Wrong-pass1');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Email or password is incorrect.')).toBeOnTheScreen();
    expect(startSession).not.toHaveBeenCalled();
  });
});
