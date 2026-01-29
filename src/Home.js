import { useState, useEffect } from 'react';
import api from './api';
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

function Home() {
  const [workouts, setWorkouts] = useState([]);
  const [comprehensiveInsights, setComprehensiveInsights] = useState(null);
  const [formData, setFormData] = useState({ type: '', duration: '', calories: '' });
  const [userProfile, setUserProfile] = useState(null);
  const [manualCalories, setManualCalories] = useState(false); // Track if user manually entered calories
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);

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
        // Sort workouts by timestamp (most recent first)
        const sortedWorkouts = response.data.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB - dateA; // Descending order (newest first)
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
      .then(response => {
        setPlannedWorkouts(response.data);
      })
      .catch(error => console.error('Error fetching planned workouts:', error));
  };

  const calculateCalories = (workoutType, duration, weightLbs) => {
    if (!workoutType || !duration || !weightLbs) return '';

    // Convert weight from lbs to kg
    const weightKg = weightLbs * 0.453592;

    // Convert duration from minutes to hours
    const durationHours = duration / 60;

    // Find MET value for workout type (case insensitive)
    const typeLower = workoutType.toLowerCase();
    let met = MET_VALUES['default'];

    // Check if workout type matches any MET value key
    for (const [key, value] of Object.entries(MET_VALUES)) {
      if (typeLower.includes(key) || key.includes(typeLower)) {
        met = value;
        break;
      }
    }

    // Calculate calories: MET * weightKg * durationHours
    const calories = Math.round(met * weightKg * durationHours);
    return calories;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    // If user manually enters calories, mark it as manual
    if (name === 'calories') {
      setManualCalories(true);
      setFormData(updatedFormData);
      return;
    }

    // Auto-calculate calories when type or duration changes, but only if user hasn't manually entered calories
    if ((name === 'type' || name === 'duration') && userProfile?.current_weight && !manualCalories) {
      const suggestedCalories = calculateCalories(
        name === 'type' ? value : formData.type,
        name === 'duration' ? value : formData.duration,
        userProfile.current_weight
      );

      // Update calories with suggestion
      if (suggestedCalories) {
        updatedFormData.calories = suggestedCalories;
      }
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/workouts', {
      type: formData.type,
      duration: parseInt(formData.duration),
      calories: parseInt(formData.calories)
    })
      .then(() => {
        setFormData({ type: '', duration: '', calories: '' });
        setManualCalories(false); // Reset manual flag for next workout
        fetchWorkouts();
        fetchComprehensiveInsights();
      })
      .catch(error => console.error('Error logging workout:', error));
  };

  const deleteWorkout = (workoutId) => {
    api.delete(`/workouts/${workoutId}`)
      .then(() => {
        fetchWorkouts();
        fetchComprehensiveInsights();
      })
      .catch(error => console.error('Error deleting workout:', error));
  };

  const getPastPlannedWorkouts = () => {
    const now = new Date();
    return plannedWorkouts.filter(workout => {
      if (workout.completed) return false; // Skip already completed workouts

      const workoutDate = new Date(workout.planned_date);

      // If there's a time, use it for comparison
      if (workout.planned_time) {
        const [hours, minutes] = workout.planned_time.split(':');
        workoutDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return workoutDate < now;
      }

      // If no time specified, consider it past if the date is before today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate < today;
    }).sort((a, b) => {
      // Sort by date, most recent first
      const dateA = new Date(a.planned_date);
      const dateB = new Date(b.planned_date);
      return dateB - dateA;
    });
  };

  const quickLogPlannedWorkout = (plannedWorkout) => {
    // Calculate calories based on user profile
    const calories = userProfile?.current_weight
      ? calculateCalories(plannedWorkout.workout_type, plannedWorkout.planned_duration, userProfile.current_weight)
      : '';

    // Create actual workout
    api.post('/workouts', {
      type: plannedWorkout.workout_type,
      duration: plannedWorkout.planned_duration,
      calories: calories || 0
    })
      .then((response) => {
        // Mark planned workout as completed
        return api.put(`/planned-workouts/${plannedWorkout.id}`, {
          ...plannedWorkout,
          completed: true,
          completed_workout_id: response.data.id
        });
      })
      .then(() => {
        fetchWorkouts();
        fetchComprehensiveInsights();
        fetchPlannedWorkouts();
        alert('Workout logged successfully!');
      })
      .catch(error => {
        console.error('Error logging planned workout:', error);
        alert('Error logging workout. Please try again.');
      });
  };

  const dismissPlannedWorkout = (plannedWorkoutId) => {
    if (window.confirm('Are you sure you want to dismiss this planned workout?')) {
      api.delete(`/planned-workouts/${plannedWorkoutId}`)
        .then(() => {
          fetchPlannedWorkouts();
        })
        .catch(error => console.error('Error dismissing planned workout:', error));
    }
  };

  return (
    <div className="App">
      <h1 style={{
        background: 'linear-gradient(135deg, #667eea 0%, #3b82f6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontSize: '48px',
        fontWeight: '900',
        marginBottom: '10px',
        letterSpacing: '-1px'
      }}>
        Your Fitness Journey
      </h1>
      <p style={{
        color: '#666',
        fontSize: '18px',
        marginBottom: '30px',
        fontWeight: '500'
      }}>
        Track, analyze, and achieve your fitness goals
      </p>

      {/* Summary Cards */}
      {comprehensiveInsights && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          maxWidth: '900px',
          margin: '0 auto 30px',
          padding: '0 20px'
        }}>
          {/* Weekly Progress Card */}
          {comprehensiveInsights.weekly_progress && (
            <div style={{
              padding: '20px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              minWidth: '200px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 10px', color: '#666' }}>Weekly Goal</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6', margin: '0 0 5px' }}>
                {comprehensiveInsights.weekly_progress.current}/{comprehensiveInsights.weekly_progress.target}
              </p>
              <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
                {comprehensiveInsights.weekly_progress.unit}
              </p>
            </div>
          )}

          {/* Week Comparison Card */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            minWidth: '200px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px', color: '#666' }}>vs Last Week</h4>
            <p style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: comprehensiveInsights.week_comparison?.workout_change_percent >= 0 ? '#10b981' : '#ef4444',
              margin: '0 0 5px'
            }}>
              {comprehensiveInsights.week_comparison?.workout_change_percent >= 0 ? '+' : ''}
              {comprehensiveInsights.week_comparison?.workout_change_percent?.toFixed(0)}%
            </p>
            <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
              workouts
            </p>
          </div>

          {/* Streak Card */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            minWidth: '200px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px', color: '#666' }}>Current Streak</h4>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', margin: '0 0 5px' }}>
              {comprehensiveInsights.streak?.current_streak || 0}
            </p>
            <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
              days
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          required
        >
          <option value="" style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          required>Select Workout Type</option>
          {Object.keys(MET_VALUES)
            .filter(key => key !== 'default')
            .sort()
            .map(workoutType => (
              <option key={workoutType} value={workoutType}>
                {workoutType.charAt(0).toUpperCase() + workoutType.slice(1)}
              </option>
            ))}
        </select>
        <input
          name="duration"
          type="number"
          value={formData.duration}
          onChange={handleChange}
          placeholder="Duration (min)"
          style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          required
        />
        <input
          name="calories"
          type="number"
          value={formData.calories}
          onChange={handleChange}
          placeholder={userProfile ? "Calories (auto-calculated)" : "Calories"}
          title="Calories are auto-calculated based on your profile. You can override this value."
          style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          required
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '4px', background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)', transition: 'all 0.3s ease' }}>
          Log Workout
        </button>
      </form>

      {/* Past Planned Workouts Section */}
      {getPastPlannedWorkouts().length > 0 && (
        <>
          <h2 style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '32px',
            fontWeight: '800',
            marginTop: '40px',
            marginBottom: '20px',
            letterSpacing: '-0.5px'
          }}>
            Missed Workouts
          </h2>
          <p style={{
            color: '#666',
            fontSize: '16px',
            marginBottom: '20px',
            maxWidth: '600px',
            margin: '0 auto 20px'
          }}>
            You have {getPastPlannedWorkouts().length} planned workout{getPastPlannedWorkouts().length !== 1 ? 's' : ''} that {getPastPlannedWorkouts().length !== 1 ? 'have' : 'has'} passed. Log them or dismiss them.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, maxWidth: '600px', margin: '0 auto 20px' }}>
            {getPastPlannedWorkouts().map((workout) => (
              <li key={workout.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: '#fff3e0',
                borderRadius: '4px',
                border: '2px solid #fb923c',
                boxShadow: '0 2px 8px rgba(251, 146, 60, 0.2)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px', color: '#333' }}>
                    {workout.workout_type.charAt(0).toUpperCase() + workout.workout_type.slice(1)}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    {new Date(workout.planned_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    {workout.planned_time && ` at ${(() => {
                      const [hours, minutes] = workout.planned_time.split(':');
                      const hour = parseInt(hours);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const displayHour = hour % 12 || 12;
                      return `${displayHour}:${minutes} ${ampm}`;
                    })()}`}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    Duration: {workout.planned_duration} minutes
                  </div>
                  {workout.notes && (
                    <div style={{ marginTop: '6px', fontSize: '13px', fontStyle: 'italic', color: '#555' }}>
                      {workout.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <button
                    onClick={() => quickLogPlannedWorkout(workout)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Log Now
                  </button>
                  <button
                    onClick={() => dismissPlannedWorkout(workout.id)}
                    style={{
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 style={{
        background: 'linear-gradient(135deg, #667eea 0%, #3b82f6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontSize: '32px',
        fontWeight: '800',
        marginTop: '40px',
        marginBottom: '20px',
        letterSpacing: '-0.5px'
      }}>
        Your Workouts
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, maxWidth: '600px', margin: '0 auto' }}>
        {workouts.map((w, idx) => (
          <li key={idx} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 15px',
            marginBottom: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #e0e0e0'
          }}>
            <span>
              {w.type.charAt(0).toUpperCase() + w.type.slice(1)} - {w.duration} min - {w.calories} cal
              {w.timestamp && (
                <span style={{ marginLeft: '8px', color: '#666', fontSize: '13px' }}>
                  {new Date(w.timestamp).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: 'America/New_York',
                    timeZoneName: 'short'
                  })}
                </span>
              )}
            </span>
            <button
              onClick={() => deleteWorkout(w.id)}
              style={{
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
