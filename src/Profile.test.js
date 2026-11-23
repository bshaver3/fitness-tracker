import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Profile from './Profile';
import api from './api';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}), { virtual: true });

jest.mock('./api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock('./AuthContext', () => ({
  useAuth: () => ({
    profileComplete: false,
    refreshProfileStatus: jest.fn()
  })
}));

jest.mock('./ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn()
  })
}));

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({ data: {} });
  api.post.mockResolvedValue({ data: {} });
});

test('clamps height inches above 11 and accepts 11', async () => {
  render(
    <Profile />
  );

  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/profile'));
  const inches = screen.getByRole('spinbutton', { name: 'Height (inches)' });

  expect(inches).toHaveAttribute('max', '11');
  fireEvent.change(inches, { target: { value: '12' } });
  expect(inches).toHaveValue(null);
  expect(screen.getByRole('alert')).toHaveTextContent('Inches cannot exceed 11');

  fireEvent.change(inches, { target: { value: '11' } });
  expect(inches).toHaveValue(11);
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});
