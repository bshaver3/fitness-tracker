import { render, screen, waitFor } from '@testing-library/react';
import Home from './Home';
import api from './api';
import { ToastProvider } from './ToastContext';

jest.mock('./api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation((path) => {
    if (path === '/food-entries/daily') {
      return Promise.resolve({
        data: {
          date: '2026-11-14',
          entries: [],
          total_calories: 0,
          target_calories: null,
          remaining_calories: null,
          over_target_calories: null,
          status: 'no_target'
        }
      });
    }

    const dataByPath = {
      '/workouts': [],
      '/insights/comprehensive': {},
      '/profile': {},
      '/planned-workouts': []
    };
    return Promise.resolve({ data: dataByPath[path] });
  });
});

test('places the shared daily food log after the workout quick-log and before workout history', async () => {
  const { container } = render(
    <ToastProvider>
      <Home />
    </ToastProvider>
  );

  const foodHeading = await screen.findByRole('heading', { name: 'Daily food log' });
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/food-entries/daily', expect.any(Object)));
  expect(screen.getByText('No food logged for this day yet')).toBeInTheDocument();
  expect(screen.getByText('For personal tracking only—not medical or nutrition advice.')).toBeInTheDocument();

  const workoutForm = container.querySelector('form.quick-log-form');
  const foodSection = foodHeading.closest('section');
  const workoutHistoryHeading = screen.getByRole('heading', { name: 'Your workouts' });
  expect(workoutForm.compareDocumentPosition(foodSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(foodSection.compareDocumentPosition(workoutHistoryHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(container.querySelector('main')).toBeNull();
});
