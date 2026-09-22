import { useState, useEffect } from 'react';
import api from './api';
import { useToast } from './ToastContext';
import ConfirmDialog from './ConfirmDialog';
import { IconChevronLeft, IconChevronRight, IconClose, IconEdit } from './Icons';
import './App.css';

// MET values for different workout types
const MET_VALUES = {
  'running': 9.8,
  'jogging': 7.0,
  'walking': 3.8,
  'cycling': 7.5,
  'swimming': 8.0,
  'weight training': 6.0,
  'yoga': 3.0,
  'pilates': 3.5,
  'hiit': 8.0,
  'crossfit': 8.0,
  'rowing': 7.0,
  'elliptical': 5.0,
  'dancing': 4.5,
  'boxing': 9.0,
  'hiking': 6.0,
  'default': 5.0
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatTime(timeString) {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function Goals() {
  const { showToast } = useToast();
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    workout_type: '',
    planned_date: '',
    planned_time: '',
    planned_duration: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchPlannedWorkouts();
    fetchProfile();
  }, []);

  const fetchPlannedWorkouts = () => {
    api.get('/planned-workouts')
      .then(response => setPlannedWorkouts(response.data))
      .catch(error => console.error('Error fetching planned workouts:', error));
  };

  const fetchProfile = () => {
    api.get('/profile')
      .then(response => {
        if (response.data && Object.keys(response.data).length > 0) {
          setUserProfile(response.data);
        }
      })
      .catch(error => console.error('Error fetching profile:', error));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const selectedDate = new Date(formData.planned_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setFormError('Cannot schedule workouts for past dates. Please select today or a future date.');
      return;
    }

    const payload = {
      workout_type: formData.workout_type,
      planned_date: formData.planned_date,
      planned_time: formData.planned_time || null,
      planned_duration: parseInt(formData.planned_duration, 10),
      notes: formData.notes || null
    };

    setSaving(true);
    const request = editingId
      ? api.put(`/planned-workouts/${editingId}`, payload)
      : api.post('/planned-workouts', payload);

    request
      .then(() => {
        resetForm();
        fetchPlannedWorkouts();
        showToast(editingId ? 'Plan updated' : 'Workout scheduled', 'success');
      })
      .catch(error => {
        console.error('Error saving planned workout:', error);
        showToast('Error saving workout plan. Please try again.', 'error');
      })
      .finally(() => setSaving(false));
  };

  const handleEdit = (workout) => {
    setFormData({
      workout_type: workout.workout_type,
      planned_date: workout.planned_date,
      planned_time: workout.planned_time || '',
      planned_duration: workout.planned_duration,
      notes: workout.notes || ''
    });
    setEditingId(workout.id);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    api.delete(`/planned-workouts/${id}`)
      .then(() => fetchPlannedWorkouts())
      .catch(error => {
        console.error('Error deleting planned workout:', error);
        showToast('Error deleting workout plan. Please try again.', 'error');
      });
  };

  const resetForm = () => {
    setFormData({
      workout_type: '',
      planned_date: '',
      planned_time: '',
      planned_duration: '',
      notes: ''
    });
    setEditingId(null);
    setFormError('');
  };

  const getWeeklyProgress = () => {
    if (!userProfile?.weekly_target_type || !userProfile?.weekly_target_value) {
      return null;
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const thisWeek = plannedWorkouts.filter(w => {
      const workoutDate = new Date(w.planned_date);
      return workoutDate >= weekStart && workoutDate <= weekEnd;
    });

    if (userProfile.weekly_target_type === 'workouts') {
      return { current: thisWeek.length, target: userProfile.weekly_target_value, unit: 'workouts' };
    }
    const totalMinutes = thisWeek.reduce((sum, w) => sum + w.planned_duration, 0);
    return { current: totalMinutes, target: userProfile.weekly_target_value, unit: 'minutes' };
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  const getWorkoutsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return plannedWorkouts
      .filter(w => w.planned_date === dateString)
      .sort((a, b) => {
        if (!a.planned_time && !b.planned_time) return 0;
        if (!a.planned_time) return 1;
        if (!b.planned_time) return -1;
        return a.planned_time.localeCompare(b.planned_time);
      });
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isSameMonth = (date) => date.getMonth() === currentMonth.getMonth();
  const changeMonth = (offset) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const weeklyProgress = getWeeklyProgress();
  const calendarDays = viewMode === 'calendar' ? getCalendarDays() : [];
  const progressPct = weeklyProgress ? Math.min((weeklyProgress.current / weeklyProgress.target) * 100, 100) : 0;
  const progressComplete = weeklyProgress && weeklyProgress.current >= weeklyProgress.target;

  return (
    <div className="app-main">
      <div className="page-header">
        <h1 className="page-title">Goal planning</h1>
        <p className="page-subtitle">Plan your future workouts to stay on track with your fitness goals.</p>
      </div>

      {weeklyProgress && (
        <div className="panel" style={{ maxWidth: '600px', marginBottom: 'var(--space-8)' }}>
          <p className="panel-title" style={{ marginBottom: 'var(--space-1)' }}>This week's progress</p>
          <p className="stat-value" style={{ fontSize: 'var(--step-lg)' }}>
            {weeklyProgress.current} / {weeklyProgress.target} {weeklyProgress.unit} planned
          </p>
          <div className="progress-track">
            <div
              className={`progress-fill${progressComplete ? ' complete' : ''}`}
              style={{ transform: `scaleX(${progressPct / 100})` }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-panel" style={{ maxWidth: '600px', marginBottom: 'var(--space-8)' }}>
        {formError && (
          <div className="banner banner-error" role="alert">{formError}</div>
        )}

        <div className="field">
          <label className="field-label" htmlFor="workout_type">Workout type</label>
          <select
            id="workout_type"
            className="select"
            name="workout_type"
            value={formData.workout_type}
            onChange={handleChange}
            required
          >
            <option value="">Select workout type</option>
            {Object.keys(MET_VALUES)
              .filter(key => key !== 'default')
              .sort()
              .map(workoutType => (
                <option key={workoutType} value={workoutType}>{capitalize(workoutType)}</option>
              ))}
          </select>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="planned_date">Date</label>
            <input
              id="planned_date"
              className="input"
              name="planned_date"
              type="date"
              value={formData.planned_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="planned_time">Time (optional)</label>
            <input
              id="planned_time"
              className="input"
              name="planned_time"
              type="time"
              value={formData.planned_time}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="planned_duration">Duration (minutes)</label>
          <input
            id="planned_duration"
            className="input"
            name="planned_duration"
            type="number"
            min="1"
            value={formData.planned_duration}
            onChange={handleChange}
            placeholder="Duration in minutes"
            required
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            className="textarea"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any notes about this workout?"
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update plan' : 'Schedule workout'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="view-toggle" role="tablist" aria-label="Planned workouts view">
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'list'}
          className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          List view
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'calendar'}
          className={`view-toggle-btn${viewMode === 'calendar' ? ' active' : ''}`}
          onClick={() => setViewMode('calendar')}
        >
          Calendar view
        </button>
      </div>

      <h2 className="section-heading">Planned workouts</h2>

      {plannedWorkouts.length === 0 ? (
        <div className="empty-state">
          <p>No workouts scheduled yet</p>
          <p>Create your first workout plan above.</p>
        </div>
      ) : viewMode === 'list' ? (
        <ul className="item-list">
          {plannedWorkouts.map((workout) => (
            <li key={workout.id} className="item-row">
              <div className="item-main">
                <span className="item-title">{capitalize(workout.workout_type)}</span>
                <span className="item-meta">
                  {formatDate(workout.planned_date)}
                  {workout.planned_time && ` at ${formatTime(workout.planned_time)}`}
                  {' · '}{workout.planned_duration} min
                </span>
                {workout.notes && <span className="item-note">{workout.notes}</span>}
              </div>
              <div className="item-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEdit(workout)}>
                  <IconEdit /> Edit
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  aria-label={`Delete planned ${workout.workout_type} workout`}
                  onClick={() => setDeleteTarget(workout.id)}
                >
                  <IconClose />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <div className="calendar-nav">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ color: 'inherit' }}
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <IconChevronLeft />
            </button>
            <h3 className="calendar-nav-title">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ color: 'inherit' }}
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <IconChevronRight />
            </button>
          </div>

          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day, index) => {
              const dayWorkouts = getWorkoutsForDate(day);
              const today = isToday(day);
              const sameMonth = isSameMonth(day);

              return (
                <div
                  key={index}
                  className={`calendar-cell${today ? ' is-today' : ''}${!sameMonth ? ' is-other-month' : ''}`}
                >
                  <span className="calendar-date">{day.getDate()}</span>
                  {dayWorkouts.map(workout => (
                    <div
                      key={workout.id}
                      className="calendar-event"
                      onClick={() => handleEdit(workout)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(workout); }}
                      title={`${workout.workout_type} - ${workout.planned_duration} min${workout.planned_time ? '\n' + formatTime(workout.planned_time) : ''}${workout.notes ? '\n' + workout.notes : ''}`}
                    >
                      <div className="calendar-event-title">{capitalize(workout.workout_type)}</div>
                      {workout.planned_time && <div>{formatTime(workout.planned_time)}</div>}
                      <div>{workout.planned_duration} min</div>
                      <button
                        type="button"
                        className="calendar-event-remove"
                        aria-label={`Delete planned ${workout.workout_type} workout`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(workout.id);
                        }}
                      >
                        <IconClose style={{ width: '0.8em', height: '0.8em' }} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this planned workout?"
        message="This will remove the planned workout from your schedule."
        confirmLabel="Delete"
        onConfirm={() => {
          handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Goals;
