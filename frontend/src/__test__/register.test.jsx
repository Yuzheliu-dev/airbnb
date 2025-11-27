import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from '../pages/RegisterPage';

const registerMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuthContext: () => ({
    register: registerMock,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('RegisterPage', () => {
  beforeEach(() => {
    registerMock.mockReset();
    navigateMock.mockReset();
  });

  it('blocks submission when passwords do not match', () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });

    fireEvent.submit(screen.getByTestId('register-form'));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('registers successfully and redirects to landing page', async () => {
    registerMock.mockResolvedValue({ token: 'token' });

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: ' Alice Admin ' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' team@airbrb.com ' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'secret' } });

    fireEvent.submit(screen.getByTestId('register-form'));

    await waitFor(() => expect(registerMock).toHaveBeenCalled());
    expect(registerMock).toHaveBeenCalledWith('team@airbrb.com', 'secret', 'Alice Admin');
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    expect(screen.getByText('Registered and logged in successfully!')).toBeInTheDocument();
  });
});

