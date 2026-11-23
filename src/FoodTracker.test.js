import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FoodTracker from './FoodTracker';
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


function localDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function makeSummary(overrides = {}) {
  return {
    date: '2026-11-14',
    entries: [],
    total_calories: 0,
    target_calories: null,
    remaining_calories: null,
    over_target_calories: null,
    status: 'no_target',
    ...overrides
  };
}

async function renderFoodTracker() {
  const view = render(
    <ToastProvider>
      <FoodTracker />
    </ToastProvider>
  );
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return view;
}

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({ data: makeSummary() });
  api.post.mockResolvedValue({ data: {} });
  api.put.mockResolvedValue({ data: {} });
  api.delete.mockResolvedValue({ data: {} });
});

test('loads the chosen date as a date-only API parameter, keeping past days distinct', async () => {
  let resolvePastDate;
  api.get
    .mockResolvedValueOnce({ data: makeSummary() })
    .mockImplementationOnce(() => new Promise((resolve) => { resolvePastDate = resolve; }));
  await renderFoodTracker();
  await screen.findByText('No food logged for this day yet');

  const dateInput = screen.getByLabelText('Choose a date');
  expect(dateInput).toHaveAttribute('max', localDateString());
  fireEvent.change(dateInput, { target: { value: '2020-02-03' } });
  await waitFor(() => expect(resolvePastDate).toBeDefined());
  await act(async () => {
    resolvePastDate({ data: makeSummary({ date: '2020-02-03' }) });
    await Promise.resolve();
    await Promise.resolve();
  });

  await waitFor(() => {
    expect(api.get).toHaveBeenLastCalledWith('/food-entries/daily', {
      params: { date: '2020-02-03' }
    });
  });
  expect(dateInput).toHaveValue('2020-02-03');
});

test('creates, edits, and deletes entries while refreshing the selected-day total', async () => {
  const user = userEvent;
  const firstEntry = { id: 'entry-1', name: 'Oatmeal', calories: 250, date: '2026-11-14' };
  const updatedEntry = { ...firstEntry, name: 'Oatmeal and berries', calories: 320 };
  api.get
    .mockResolvedValueOnce({ data: makeSummary() })
    .mockResolvedValueOnce({ data: makeSummary({ entries: [firstEntry], total_calories: 250, target_calories: 500, remaining_calories: 250, status: 'remaining' }) })
    .mockResolvedValueOnce({ data: makeSummary({ entries: [updatedEntry], total_calories: 320, target_calories: 500, remaining_calories: 180, status: 'remaining' }) })
    .mockResolvedValueOnce({ data: makeSummary({ target_calories: 500, status: 'remaining', remaining_calories: 500 }) });

  await renderFoodTracker();
  await screen.findByText('No food logged for this day yet');
  await user.type(screen.getByLabelText('Food name'), 'Oatmeal');
  await user.type(screen.getByLabelText('Calories (kcal)'), '250');
  await user.click(screen.getByRole('button', { name: 'Add food' }));

  expect(await screen.findByText('Oatmeal')).toBeInTheDocument();
  expect(await screen.findByText('250 calories remaining')).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/food-entries', {
    name: 'Oatmeal', calories: 250, date: localDateString()
  });

  await user.click(screen.getByRole('button', { name: 'Edit Oatmeal' }));
  const nameInput = screen.getByLabelText('Food name');
  const calorieInput = screen.getByLabelText('Calories (kcal)');
  await user.clear(nameInput);
  await user.type(nameInput, 'Oatmeal and berries');
  await user.clear(calorieInput);
  await user.type(calorieInput, '320');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));

  expect(await screen.findByText('Oatmeal and berries')).toBeInTheDocument();
  expect(await screen.findByText('180 calories remaining')).toBeInTheDocument();
  expect(api.put).toHaveBeenCalledWith('/food-entries/entry-1', {
    name: 'Oatmeal and berries', calories: 320, date: localDateString()
  });

  await user.click(screen.getByRole('button', { name: 'Delete Oatmeal and berries' }));
  const dialog = screen.getByRole('alertdialog');
  await user.click(within(dialog).getByRole('button', { name: 'Delete entry' }));

  expect(await screen.findByText('No food logged for this day yet')).toBeInTheDocument();
  expect(await screen.findByText('0')).toBeInTheDocument();
  expect(api.delete).toHaveBeenCalledWith('/food-entries/entry-1');
});

test('validates food names and positive whole-number calories before sending a request', async () => {
  const user = userEvent;
  await renderFoodTracker();
  await screen.findByText('No food logged for this day yet');

  await user.click(screen.getByRole('button', { name: 'Add food' }));
  expect(await screen.findByText('Enter a food name.')).toBeInTheDocument();
  await user.type(screen.getByLabelText('Food name'), 'Soup');
  await user.type(screen.getByLabelText('Calories (kcal)'), '0');
  await user.click(screen.getByRole('button', { name: 'Add food' }));
  expect(await screen.findByText('Calories must be a whole number from 1 to 10,000.')).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});

test.each([
  ['below target', 150, 200, 'remaining', 50, null, '50 calories remaining'],
  ['equal to target', 200, 200, 'on_target', null, null, 'You are at your daily target.'],
  ['above target', 250, 200, 'over_target', null, 50, '50 calories over target']
])('shows the correct comparison when intake is %s', async (_label, total, target, status, remaining, over, text) => {
  api.get.mockResolvedValue({
    data: makeSummary({
      entries: [{ id: 'entry', name: 'Meal', calories: total, date: '2026-11-14' }],
      total_calories: total,
      target_calories: target,
      status,
      remaining_calories: remaining,
      over_target_calories: over
    })
  });

  await renderFoodTracker();
  expect(await screen.findByText(text)).toBeInTheDocument();
});

test('shows an unavailable comparison for unknown API status even when calories happen to match', async () => {
  api.get.mockResolvedValue({
    data: makeSummary({
      total_calories: 2000,
      target_calories: 2000,
      status: 'unrecognized'
    })
  });

  await renderFoodTracker();

  expect(await screen.findByText('Target comparison unavailable.')).toBeInTheDocument();
  expect(screen.queryByText('You are at your daily target.')).not.toBeInTheDocument();
});

test('supports setting and removing an explicitly chosen target, including the unset state', async () => {
  const user = userEvent;
  api.get
    .mockResolvedValueOnce({ data: makeSummary() })
    .mockResolvedValueOnce({ data: makeSummary({ target_calories: 1800, status: 'remaining', remaining_calories: 1800 }) })
    .mockResolvedValueOnce({ data: makeSummary() });

  await renderFoodTracker();
  await screen.findByText('Not set');
  expect(screen.getByText('Set a daily target to compare your intake.')).toBeInTheDocument();
  await user.type(screen.getByLabelText('Target (kcal)'), '1800');
  await user.click(screen.getByRole('button', { name: 'Set target' }));

  expect(await screen.findByText('1800 kcal')).toBeInTheDocument();
  expect(api.put).toHaveBeenCalledWith('/food-target', { daily_calorie_target: 1800 });
  await user.click(screen.getByRole('button', { name: 'Remove target' }));
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove target' }));

  expect(await screen.findByText('Not set')).toBeInTheDocument();
  expect(api.delete).toHaveBeenCalledWith('/food-target');
});

test('rejects a daily target above the backend maximum with a specific correction message', async () => {
  const user = userEvent;
  await renderFoodTracker();
  await screen.findByText('Not set');

  const targetInput = screen.getByLabelText('Target (kcal)');
  expect(targetInput).toHaveAttribute('max', '10000');
  await user.type(targetInput, '10001');
  await user.click(screen.getByRole('button', { name: 'Set target' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Daily target must be a whole number from 1 to 10,000 kcal. Enter a value within this range.'
  );
  expect(api.put).not.toHaveBeenCalled();
});

test('shows a recoverable load error and retries the selected day', async () => {
  const user = userEvent;
  let resolveRetry;
  api.get
    .mockRejectedValueOnce(new Error('network error'))
    .mockImplementationOnce(() => new Promise((resolve) => { resolveRetry = resolve; }));

  await renderFoodTracker();
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this day’s food entries.');
  await user.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(resolveRetry).toBeDefined());
  await act(async () => {
    resolveRetry({ data: makeSummary() });
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(await screen.findByText('No food logged for this day yet')).toBeInTheDocument();
});
