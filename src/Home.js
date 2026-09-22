import { useState, useEffect } from 'react';
import api from './api';
import { useToast } from './ToastContext';
import ConfirmDialog from './ConfirmDialog';
import { IconTrash, IconCheck } from './Icons';
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
  'default': 5.0  // Default MET value if type not found
};

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short'
  });
}

function formatTime(timeString) {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function Home() {
  const { showToast } = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [comprehensiveInsights, setComprehensiveInsights] = useState(null);
  const [formData, setFormData] = useState({ type: '', duration: '', calories: '' });
  const [userProfile, setUserProfile] = useState(null);
  const [manualCalories, setManualCalories] = useState(false);
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    fetchWorkouts();
    fetchComprehensiveInsights();
    fetchProfile();
    fetchPlannedWorkouts();
  }, []);

  const fetchProfile = () => {
    api.get('/profile')
      .then(response => {
        if (response.data && Object.keys(response.data).length > 0) {
          setUserProfile(response.data);
        }
      })
      .catch(error => console.error('Error fetching profile:', error));
  };

  const fetchWorkouts = () => {
    api.get('/workouts')
      .then(response => {
        const sortedWorkouts = response.data.sort((a, b) => {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        setWorkouts(sortedWorkouts);
      })
      .catch(error => console.error('Error fetching workouts:', error));
  };

  const fetchComprehensiveInsights = () => {
    api.get('/insights/comprehensive')
      .then(response => setComprehensiveInsights(response.data))
      .catch(error => console.error('Error fetching comprehensive insights:', error));
  };

  const fetchPlannedWorkouts = () => {
    api.get('/planned-workouts')
      .then(response => setPlannedWorkouts(response.data))
      .catch(error => console.error('Error fetching planned workouts:', error));
  };

  const calculateCalories = (workoutType, duration, weightLbs) => {
    if (!workoutType || !duration || !weightLbs) return '';

    const weightKg = weightLbs * 0.453592;
    const durationHours = duration / 60;
    const typeLower = workoutType.toLowerCase();
    let met = MET_VALUES['default'];

    for (const [key, value] of Object.entries(MET_VALUES)) {
      if (typeLower.includes(key) || key.includes(typeLower)) {
        met = value;
        break;
      }
    }

    return Math.round(met * weightKg * durationHours);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    if (name === 'calories') {
      setManualCalories(true);
      setFormData(updatedFormData);
      return;
    }

    if ((name === 'type' || name === 'duration') && userProfile?.current_weight && !manualCalories) {
      const suggestedCalories = calculateCalories(
        name === 'type' ? value : formData.type,
        name === 'duration' ? value : formData.duration,
        userProfile.current_weight
      );

      if (suggestedCalories) {
        updatedFormData.calories = suggestedCalories;
      }
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    api.post('/workouts', {
      type: formData.type,
      duration: parseInt(formData.duration),
      calories: parseInt(formData.calories)
    })
      .then(() => {
        setFormData({ type: '', duration: '', calories: '' });
        setManualCalories(false);
        fetchWorkouts();
        fetchComprehensiveInsights();
        showToast('Workout logged', 'success');
      })
      .catch(error => {
        console.error('Error logging workout:', error);
        showToast('Error logging workout. Please try again.', 'error');
      })
      .finally(() => setSubmitting(false));
  };

  const deleteWorkout = (workoutId) => {
    api.delete(`/workouts/${workoutId}`)
      .then(() => {
        fetchWorkouts();
        fetchComprehensiveInsights();
      })
      .catch(error => {
        console.error('Error deleting workout:', error);
        showToast('Error deleting workout. Please try again.', 'error');
      });
  };

  const getPastPlannedWorkouts = () => {
    const now = new Date();
    return plannedWorkouts.filter(workout => {
      if (workout.completed) return false;

      const workoutDate = new Date(workout.planned_date);

      if (workout.planned_time) {
        const [hours, minutes] = workout.planned_time.split(':');
        workoutDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return workoutDate < now;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate < today;
    }).sort((a, b) => new Date(b.planned_date) - new Date(a.planned_date));
  };

  const quickLogPlannedWorkout = (plannedWorkout) => {
    const calories = userProfile?.current_weight
      ? calculateCalories(plannedWorkout.workout_type, plannedWorkout.planned_duration, userProfile.current_weight)
      : '';

    api.post('/workouts', {
      type: plannedWorkout.workout_type,
      duration: plannedWorkout.planned_duration,
      calories: calories || 0
    })
      .then((response) => api.put(`/planned-workouts/${plannedWorkout.id}`, {
        ...plannedWorkout,
        completed: true,
        completed_workout_id: response.data.id
      }))
      .then(() => {
        fetchWorkouts();
        fetchComprehensiveInsights();
        fetchPlannedWorkouts();
        showToast('Workout logged', 'success');
      })
      .catch(error => {
        console.error('Error logging planned workout:', error);
        showToast('Error logging workout. Please try again.', 'error');
      });
  };

  const dismissPlannedWorkout = (plannedWorkoutId) => {
    api.delete(`/planned-workouts/${plannedWorkoutId}`)
      .then(() => fetchPlannedWorkouts())
      .catch(error => {
        console.error('Error dismissing planned workout:', error);
        showToast('Error dismissing workout. Please try again.', 'error');
      });
  };

  const handleConfirm = () => {
    if (!confirmTarget) return;
    if (confirmTarget.type === 'delete-workout') {
      deleteWorkout(confirmTarget.id);
    } else if (confirmTarget.type === 'dismiss-planned') {
      dismissPlannedWorkout(confirmTarget.id);
    }
    setConfirmTarget(null);
  };

  const pastPlannedWorkouts = getPastPlannedWorkouts();

  return (
    <div className="app-main">
      <div className="page-header">
        <h1 className="page-title">Your fitness journey</h1>
        <p className="page-subtitle">Track, analyze, and achieve your fitness goals.</p>
      </div>

      {comprehensiveInsights && (
        <div className="stat-grid">
          {comprehensiveInsights.weekly_progress && (
            <div className="stat-card">
              <p className="stat-label">Weekly goal</p>
              <p className="stat-value">
                {comprehensiveInsights.weekly_progress.current}/{comprehensiveInsights.weekly_progress.target}
              </p>
              <p className="stat-unit">{comprehensiveInsights.weekly_progress.unit}</p>
            </div>
          )}

          <div className="stat-card">
            <p className="stat-label">vs last week</p>
            <p className={`stat-value ${comprehensiveInsights.week_comparison?.workout_change_percent >= 0 ? 'positive' : 'negative'}`}>
              {comprehensiveInsights.week_comparison?.workout_change_percent >= 0 ? '+' : ''}
              {comprehensiveInsights.week_comparison?.workout_change_percent?.toFixed(0)}%
            </p>
            <p className="stat-unit">workouts</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Current streak</p>
            <p className="stat-value">{comprehensiveInsights.streak?.current_streak || 0}</p>
            <p className="stat-unit">days</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="quick-log-form">
        <div className="field">
          <label className="field-label" htmlFor="workout-type">Workout type</label>
          <select
            id="workout-type"
            className="select"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="">Select workout type</option>
            {Object.keys(MET_VALUES)
              .filter(key => key !== 'default')
              .sort()
              .map(workoutType => (
                <option key={workoutType} value={workoutType}>
                  {capitalize(workoutType)}
                </option>
              ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="workout-duration">Duration (min)</label>
          <input
            id="workout-duration"
            className="input"
            name="duration"
            type="number"
            min="1"
            value={formData.duration}
            onChange={handleChange}
            placeholder="30"
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="workout-calories">Calories</label>
          <input
            id="workout-calories"
            className="input"
            name="calories"
            type="number"
            min="0"
            value={formData.calories}
            onChange={handleChange}
            placeholder={userProfile ? 'Auto-calculated' : 'Calories'}
            title="Calories are auto-calculated based on your profile. You can override this value."
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Logging…' : 'Log workout'}
        </button>
      </form>

      {pastPlannedWorkouts.length > 0 && (
        <>
          <h2 className="section-heading">Missed workouts</h2>
          <p className="page-subtitle" style={{ marginBottom: 'var(--space-4)' }}>
            You have {pastPlannedWorkouts.length} planned workout{pastPlannedWorkouts.length !== 1 ? 's' : ''} that {pastPlannedWorkouts.length !== 1 ? 'have' : 'has'} passed. Log them or dismiss them.
          </p>
          <ul className="item-list" style={{ marginBottom: 'var(--space-8)' }}>
            {pastPlannedWorkouts.map((workout) => (
              <li key={workout.id} className="item-row item-row--flagged">
                <div className="item-main">
                  <span className="item-title">{capitalize(workout.workout_type)}</span>
                  <span className="item-meta">
                    {new Date(workout.planned_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    {workout.planned_time && ` at ${formatTime(workout.planned_time)}`}
                    {' · '}{workout.planned_duration} min
                  </span>
                  {workout.notes && <span className="item-note">{workout.notes}</span>}
                </div>
                <div className="item-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => quickLogPlannedWorkout(workout)}
                  >
                    <IconCheck /> Log now
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setConfirmTarget({ type: 'dismiss-planned', id: workout.id })}
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="section-heading">Your workouts</h2>
      {workouts.length === 0 ? (
        <div className="empty-state">
          <p>No workouts logged yet</p>
          <p>Log your first workout above to start building your streak.</p>
        </div>
      ) : (
        <ul className="item-list">
          {workouts.map((w) => (
            <li key={w.id} className="item-row">
              <div className="item-main">
                <span className="item-title">
                  {capitalize(w.type)} · {w.duration} min · {w.calories} cal
                </span>
                {w.timestamp && <span className="item-meta">{formatTimestamp(w.timestamp)}</span>}
              </div>
              <div className="item-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  aria-label={`Delete ${w.type} workout`}
                  onClick={() => setConfirmTarget({ type: 'delete-workout', id: w.id })}
                >
                  <IconTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.type === 'delete-workout' ? 'Delete this workout?' : 'Dismiss this planned workout?'}
        message={
          confirmTarget?.type === 'delete-workout'
            ? 'This will permanently remove the logged workout and its calories from your history.'
            : 'This will remove the planned workout without logging it as completed.'
        }
        confirmLabel={confirmTarget?.type === 'delete-workout' ? 'Delete' : 'Dismiss'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

export default Home;
