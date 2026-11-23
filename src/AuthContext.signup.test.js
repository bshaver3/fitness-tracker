import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signUp } from 'aws-amplify/auth';
import { AuthProvider } from './AuthContext';
import Signup from './Signup';
import api from './api';
import awsconfig from './aws-exports';
import { getAmplifyAuthConfig } from './amplifyAuthConfig';

jest.mock('react-router-dom', () => {
  const React = jest.requireActual('react');
  return {
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
    useNavigate: () => jest.fn()
  };
}, { virtual: true });

jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  confirmSignUp: jest.fn(),
  getCurrentUser: jest.fn()
}));

jest.mock('./api', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

beforeEach(() => {
  jest.clearAllMocks();
  Amplify.configure(getAmplifyAuthConfig(awsconfig));
  getCurrentUser.mockResolvedValue({ username: 'test-user' });
  api.get.mockResolvedValue({ data: {} });
  signUp.mockImplementation(() => {
    expect(Amplify.getConfig().Auth.Cognito).toMatchObject({
      userPoolId: 'us-east-1_fAO8zL6Gx',
      userPoolClientId: '2ufqqplj9s5n1p9e93is8c5b9h'
    });
    return Promise.resolve({ nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } });
  });
});

test('submits signup through modular Auth only after Cognito is configured', async () => {
  render(
    <AuthProvider>
      <Signup />
    </AuthProvider>
  );
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

  await userEvent.type(screen.getByLabelText('Email'), 'person@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'StrongPass123!');
  await userEvent.type(screen.getByLabelText('Confirm password'), 'StrongPass123!');
  await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

  expect(await screen.findByLabelText('Verification code')).toBeInTheDocument();
  expect(signUp).toHaveBeenCalledWith({
    username: 'person@example.com',
    password: 'StrongPass123!',
    options: { userAttributes: { email: 'person@example.com' } }
  });
});
