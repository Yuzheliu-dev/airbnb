import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../pages/LoginPage';

const loginMock = vi.fn();
const navigateMock = vi.fn();
let locationState = {};

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    login: loginMock,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => locationState,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
    navigateMock.mockReset();
    locationState = {};
  });

  it('submits trimmed credentials and redirects to preserved route', async () => {
    locationState = { state: { from: { pathname: '/host/listings' } } };
    loginMock.mockResolvedValue({ token: 'token' });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' user@example.com ' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
    expect(loginMock).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(navigateMock).toHaveBeenCalledWith('/host/listings', { replace: true });
    expect(screen.getByText('Logged in successfully!')).toBeInTheDocument();
  });

  it('shows backend error when login fails', async () => {
    loginMock.mockRejectedValue(new Error('Invalid login'));

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(screen.getByText('Invalid login')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

