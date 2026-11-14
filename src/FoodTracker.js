import { useEffect, useState } from 'react';
import api from './api';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from './ToastContext';
import './App.css';

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const EMPTY_ENTRY = { name: '', calories: '' };

function FoodTracker() {
  const { showToast } = useToast();
  const today = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [entryForm, setEntryForm] = useState(EMPTY_ENTRY);
  const [editingId, setEditingId] = useState(null);
  const [entryError, setEntryError] = useState('');
  const [savingEntry, setSavingEntry] = useState(false);
  const [targetValue, setTargetValue] = useState('');
  const [targetError, setTargetError] = useState('');
  const [savingTarget, setSavingTarget] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    setSummary(null);

    api.get('/food-entries/daily', { params: { date: selectedDate } })
      .then((response) => {
        if (active) setSummary(response.data);
      })
      .catch(() => {
        if (active) setLoadError('Could not load this day’s food entries. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDate, refreshKey]);

  useEffect(() => {
    if (summary) setTargetValue(summary.target_calories ?? '');
  }, [summary]);

  const handleDateChange = (event) => {
    const nextDate = event.target.value;
    if (!nextDate || nextDate > today) return;
    setSelectedDate(nextDate);
    setEntryForm(EMPTY_ENTRY);
    setEditingId(null);
    setEntryError('');
    setTargetError('');
  };

  const handleEntryChange = (event) => {
    setEntryForm({ ...entryForm, [event.target.name]: event.target.value });
    setEntryError('');
  };

  const handleEntrySubmit = async (event) => {
    event.preventDefault();
    const name = entryForm.name.trim();
    const calories = Number(entryForm.calories);

    if (!name) {
      setEntryError('Enter a food name.');
      return;
    }
    if (name.length > 200) {
      setEntryError('Food name must be 200 characters or fewer.');
      return;
    }
    if (!Number.isInteger(calories) || calories < 1 || calories > 10000) {
      setEntryError('Calories must be a whole number from 1 to 10,000.');
      return;
    }

    setSavingEntry(true);
    setEntryError('');
    const payload = { name, calories, date: selectedDate };
    try {
      if (editingId) {
        await api.put(`/food-entries/${editingId}`, payload);
        showToast('Food entry updated', 'success');
      } else {
        await api.post('/food-entries', payload);
        showToast('Food entry added', 'success');
      }
      setEntryForm(EMPTY_ENTRY);
      setEditingId(null);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setEntryError('Could not save this food entry. Please try again.');
    } finally {
      setSavingEntry(false);
    }
  };

  const beginEdit = (entry) => {
    setEntryForm({ name: entry.name, calories: String(entry.calories) });
    setEditingId(entry.id);
    setEntryError('');
  };

  const cancelEdit = () => {
    setEntryForm(EMPTY_ENTRY);
    setEditingId(null);
    setEntryError('');
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setConfirmTarget(null);
    if (target.type === 'calorie-target') {
      setSavingTarget(true);
      setTargetError('');
      try {
        await api.delete('/food-target');
        showToast('Daily calorie target removed', 'success');
        setRefreshKey((key) => key + 1);
      } catch (error) {
        setTargetError('Could not remove your daily target. Please try again.');
      } finally {
        setSavingTarget(false);
      }
      return;
    }

    setDeletingEntry(true);
    setEntryError('');
    try {
      await api.delete(`/food-entries/${target.id}`);
      showToast('Food entry deleted', 'success');
      if (editingId === target.id) cancelEdit();
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setEntryError('Could not delete this food entry. Please try again.');
    } finally {
      setDeletingEntry(false);
    }
  };

  const handleTargetSubmit = async (event) => {
    event.preventDefault();
    const calories = Number(targetValue);
    if (!Number.isInteger(calories) || calories < 1) {
      setTargetError('Daily target must be a positive whole number of calories.');
      return;
    }

    setSavingTarget(true);
    setTargetError('');
    try {
      await api.put('/food-target', { daily_calorie_target: calories });
      showToast('Daily calorie target saved', 'success');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setTargetError('Could not save your daily target. Please try again.');
    } finally {
      setSavingTarget(false);
    }
  };

  const comparison = () => {
    if (!summary || summary.target_calories == null) {
      return 'Set a daily target to compare your intake.';
    }
    if (summary.status === 'remaining') {
      return `${summary.remaining_calories} calories remaining`;
    }
    if (summary.status === 'over_target') {
      return `${summary.over_target_calories} calories over target`;
    }
    return 'You are at your daily target.';
  };

  return (
    <main className="app-main food-tracker">
      <header className="page-header">
        <h1 className="page-title">Daily calories</h1>
        <p className="page-subtitle">Log what you ate and compare it with your own daily target.</p>
      </header>

      <section className="food-date-panel" aria-label="Selected day">
        <label className="field-label" htmlFor="food-date">Choose a date</label>
        <input
          id="food-date"
          className="input food-date-input"
          type="date"
          value={selectedDate}
          max={today}
          onChange={handleDateChange}
        />
      </section>

      {loadError && (
        <div className="banner banner-error" role="alert">
          <span>{loadError}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRefreshKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p className="food-loading" role="status">Loading daily calories…</p>
      ) : summary && (
        <>
          <section className="food-summary" aria-label="Daily calorie summary">
            <div className="food-summary-total">
              <span className="food-summary-label">Calories logged</span>
              <strong>{summary.total_calories}</strong>
              <span>kcal</span>
            </div>
            <div className="food-summary-target">
              <span className="food-summary-label">Daily target</span>
              <strong>{summary.target_calories == null ? 'Not set' : `${summary.target_calories} kcal`}</strong>
              <span className="food-comparison" aria-live="polite">{comparison()}</span>
            </div>
          </section>

          <section className="food-panel" aria-labelledby="food-target-heading">
            <h2 id="food-target-heading" className="section-heading">Your daily calorie target</h2>
            <form className="food-target-form" onSubmit={handleTargetSubmit} noValidate>
              <div className="field">
                <label className="field-label" htmlFor="food-target">Target (kcal)</label>
                <input
                  id="food-target"
                  className="input"
                  name="target"
                  type="number"
                  min="1"
                  step="1"
                  value={targetValue}
                  onChange={(event) => { setTargetValue(event.target.value); setTargetError(''); }}
                  placeholder="Enter a target you choose"
                />
              </div>
              <div className="food-target-actions">
                <button type="submit" className="btn btn-primary" disabled={savingTarget}>
                  {savingTarget ? 'Saving…' : summary.target_calories == null ? 'Set target' : 'Update target'}
                </button>
                {summary.target_calories != null && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={savingTarget}
                    onClick={() => setConfirmTarget({ type: 'calorie-target' })}
                  >
                    Remove target
                  </button>
                )}
              </div>
              {targetError && <p className="food-form-error" role="alert">{targetError}</p>}
            </form>
          </section>

          <section className="food-panel" aria-labelledby="food-entries-heading">
            <h2 id="food-entries-heading" className="section-heading">Food entries</h2>
            <form className="food-entry-form" onSubmit={handleEntrySubmit} noValidate>
              <div className="field">
                <label className="field-label" htmlFor="food-name">Food name</label>
                <input
                  id="food-name"
                  className="input"
                  name="name"
                  type="text"
                  maxLength="200"
                  value={entryForm.name}
                  onChange={handleEntryChange}
                  placeholder="e.g. oatmeal"
                  aria-describedby={entryError ? 'food-entry-error' : undefined}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="food-calories">Calories (kcal)</label>
                <input
                  id="food-calories"
                  className="input"
                  name="calories"
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={entryForm.calories}
                  onChange={handleEntryChange}
                  placeholder="300"
                  aria-describedby={entryError ? 'food-entry-error' : undefined}
                />
              </div>
              <div className="food-entry-actions">
                <button type="submit" className="btn btn-primary" disabled={savingEntry || deletingEntry}>
                  {savingEntry ? 'Saving…' : editingId ? 'Save changes' : 'Add food'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={savingEntry}>
                    Cancel edit
                  </button>
                )}
              </div>
              {entryError && <p id="food-entry-error" className="food-form-error" role="alert">{entryError}</p>}
            </form>

            {summary.entries.length === 0 ? (
              <div className="empty-state food-empty-state">
                <p>No food logged for this day yet</p>
                <p>Add an entry above to see your daily calorie total.</p>
              </div>
            ) : (
              <ul className="item-list food-entry-list">
                {summary.entries.map((entry) => (
                  <li key={entry.id} className="item-row">
                    <div className="item-main">
                      <span className="item-title">{entry.name}</span>
                      <span className="item-meta">{entry.calories} kcal</span>
                    </div>
                    <div className="item-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        aria-label={`Edit ${entry.name}`}
                        onClick={() => beginEdit(entry)}
                        disabled={savingEntry || deletingEntry}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        aria-label={`Delete ${entry.name}`}
                        onClick={() => setConfirmTarget({ type: 'food-entry', id: entry.id })}
                        disabled={savingEntry || deletingEntry}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.type === 'calorie-target' ? 'Remove your daily target?' : 'Delete this food entry?'}
        message={confirmTarget?.type === 'calorie-target'
          ? 'Your calorie target will be unset. You can choose a new target at any time.'
          : 'This will permanently remove the food entry from this day.'}
        confirmLabel={confirmTarget?.type === 'calorie-target' ? 'Remove target' : 'Delete entry'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </main>
  );
}

export default FoodTracker;
