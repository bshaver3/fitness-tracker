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
  'default': 5.0
};

function Goals() {
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

    // Validate that the planned date is not in the past
    const selectedDate = new Date(formData.planned_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert('Cannot schedule workouts for past dates. Please select today or a future date.');
      return;
    }

    const payload = {
      workout_type: formData.workout_type,
      planned_date: formData.planned_date,
      planned_time: formData.planned_time || null,
      planned_duration: parseInt(formData.planned_duration),
      notes: formData.notes || null
    };

    if (editingId) {
      api.put(`/planned-workouts/${editingId}`, payload)
        .then(() => {
          resetForm();
          fetchPlannedWorkouts();
        })
        .catch(error => console.error('Error updating workout:', error));
    } else {
      api.post('/planned-workouts', payload)
        .then(() => {
          resetForm();
          fetchPlannedWorkouts();
        })
        .catch(error => console.error('Error creating workout:', error));
    }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this planned workout?')) {
      api.delete(`/planned-workouts/${id}`)
        .then(() => {
          fetchPlannedWorkouts();
        })
        .catch(error => console.error('Error deleting workout:', error));
    }
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
      return {
        current: thisWeek.length,
        target: userProfile.weekly_target_value,
        unit: 'workouts'
      };
    } else {
      const totalMinutes = thisWeek.reduce((sum, w) => sum + w.planned_duration, 0);
      return {
        current: totalMinutes,
        target: userProfile.weekly_target_value,
        unit: 'minutes'
      };
    }
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
    const workouts = plannedWorkouts.filter(w => w.planned_date === dateString);
    // Sort by time - workouts without time appear last
    return workouts.sort((a, b) => {
      if (!a.planned_time && !b.planned_time) return 0;
      if (!a.planned_time) return 1;
      if (!b.planned_time) return -1;
      return a.planned_time.localeCompare(b.planned_time);
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const changeMonth = (offset) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const weeklyProgress = getWeeklyProgress();
  const calendarDays = viewMode === 'calendar' ? getCalendarDays() : [];

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
        Goal Planning
      </h1>
      <p style={{ color: '#666', fontSize: '18px', fontWeight: '500', maxWidth: '600px', margin: '0 auto 20px' }}>
        Plan your future workouts to stay on track with your fitness goals
      </p>

      {weeklyProgress && (
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 30px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ marginTop: 0 }}>This Week's Progress</h3>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6', margin: '10px 0' }}>
            {weeklyProgress.current} / {weeklyProgress.target} {weeklyProgress.unit} planned
          </p>
          <div style={{
            width: '100%',
            height: '20px',
            backgroundColor: '#e0e0e0',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min((weeklyProgress.current / weeklyProgress.target) * 100, 100)}%`,
              height: '100%',
              background: weeklyProgress.current >= weeklyProgress.target ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto 30px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3>Workout Type</h3>
          <select
            name="workout_type"
            value={formData.workout_type}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          >
            <option value="">Select Workout Type</option>
            {Object.keys(MET_VALUES)
              .filter(key => key !== 'default')
              .sort()
              .map(workoutType => (
                <option key={workoutType} value={workoutType}>
                  {workoutType.charAt(0).toUpperCase() + workoutType.slice(1)}
                </option>
              ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Date</h3>
          <input
            name="planned_date"
            type="date"
            value={formData.planned_date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Time (optional)</h3>
          <input
            name="planned_time"
            type="time"
            value={formData.planned_time}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Duration (minutes)</h3>
          <input
            name="planned_duration"
            type="number"
            value={formData.planned_duration}
            onChange={handleChange}
            placeholder="Duration in minutes"
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
            required
            min="1"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Notes (optional)</h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any notes about this workout?"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              minHeight: '80px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '12px 20px',
              fontSize: '16px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            {editingId ? 'Update Plan' : 'Schedule Workout'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: '12px 20px',
                fontSize: '16px',
                borderRadius: '4px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button
          onClick={() => setViewMode('list')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            borderRadius: '4px',
            background: viewMode === 'list' ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' : '#e0e0e0',
            color: viewMode === 'list' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginRight: '10px',
            boxShadow: viewMode === 'list' ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          List View
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            borderRadius: '4px',
            background: viewMode === 'calendar' ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' : '#e0e0e0',
            color: viewMode === 'calendar' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: viewMode === 'calendar' ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          Calendar View
        </button>
      </div>

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
        Planned Workouts
      </h2>

      {plannedWorkouts.length === 0 ? (
        <div style={{
          padding: '30px',
          textAlign: 'center',
          color: '#666',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <p style={{ fontSize: '18px' }}>No workouts scheduled yet.</p>
          <p>Create your first workout plan above!</p>
        </div>
      ) : viewMode === 'list' ? (
        <ul style={{ listStyle: 'none', padding: 0, maxWidth: '600px', margin: '0 auto' }}>
          {plannedWorkouts.map((workout) => (
            <li key={workout.id} style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '15px',
              marginBottom: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                    {workout.workout_type.charAt(0).toUpperCase() + workout.workout_type.slice(1)}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    {formatDate(workout.planned_date)}
                    {workout.planned_time && ` at ${formatTime(workout.planned_time)}`}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    Duration: {workout.planned_duration} minutes
                  </div>
                  {workout.notes && (
                    <div style={{ marginTop: '8px', fontSize: '14px', fontStyle: 'italic', color: '#555' }}>
                      {workout.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(workout)}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(workout.id)}
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
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          {/* Calendar Header with Month Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            backgroundColor: '#282c34',
            padding: '15px 20px',
            borderRadius: '4px'
          }}>
            <button
              onClick={() => changeMonth(-1)}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              ← Previous
            </button>
            <h2 style={{ color: 'white', margin: 0 }}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Next →
            </button>
          </div>

          {/* Days of Week Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '4px'
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{
                textAlign: 'center',
                fontWeight: 'bold',
                padding: '10px',
                backgroundColor: '#282c34',
                color: 'white',
                borderRadius: '4px'
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {calendarDays.map((day, index) => {
              const dayWorkouts = getWorkoutsForDate(day);
              const today = isToday(day);
              const sameMonth = isSameMonth(day);

              return (
                <div
                  key={index}
                  style={{
                    minHeight: '120px',
                    backgroundColor: sameMonth ? '#f5f5f5' : '#fafafa',
                    border: today ? '3px solid #8b5cf6' : '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: today ? '0 4px 15px rgba(139, 92, 246, 0.2)' : 'none'
                  }}
                >
                  <div style={{
                    fontWeight: today ? 'bold' : 'normal',
                    color: today ? '#8b5cf6' : (sameMonth ? '#333' : '#999'),
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    {day.getDate()}
                  </div>

                  {/* Workout Cards for this day */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {dayWorkouts.map(workout => (
                      <div
                        key={workout.id}
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                          color: 'white',
                          padding: '6px 8px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => handleEdit(workout)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title={`${workout.workout_type} - ${workout.planned_duration} min${workout.planned_time ? '\n' + formatTime(workout.planned_time) : ''}${workout.notes ? '\n' + workout.notes : ''}`}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                          {workout.workout_type.charAt(0).toUpperCase() + workout.workout_type.slice(1)}
                        </div>
                        {workout.planned_time && (
                          <div style={{ fontSize: '10px', marginBottom: '2px' }}>
                            {formatTime(workout.planned_time)}
                          </div>
                        )}
                        <div style={{ fontSize: '10px' }}>
                          {workout.planned_duration} min
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(workout.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            borderRadius: '2px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Goals;
