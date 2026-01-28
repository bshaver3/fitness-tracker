import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE;

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
  const [insights, setInsights] = useState(null);
  const [formData, setFormData] = useState({ type: '', duration: '', calories: '' });
  const [userProfile, setUserProfile] = useState(null);
  const [manualCalories, setManualCalories] = useState(false); // Track if user manually entered calories

  useEffect(() => {
    fetchWorkouts();
    fetchInsights();
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    axios.get(`${API_BASE}/profile`)
      .then(response => {
        if (response.data && Object.keys(response.data).length > 0) {
          setUserProfile(response.data);
        }
      })
      .catch(error => console.error('Error fetching profile:', error));
  };

  const fetchWorkouts = () => {
    axios.get(`${API_BASE}/workouts`)
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

  const fetchInsights = () => {
    axios.get(`${API_BASE}/insights`)
      .then(response => setInsights(response.data))
      .catch(error => console.error('Error fetching insights:', error));
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
    axios.post(`${API_BASE}/workouts`, {
      type: formData.type,
      duration: parseInt(formData.duration),
      calories: parseInt(formData.calories)
    })
      .then(() => {
        setFormData({ type: '', duration: '', calories: '' });
        setManualCalories(false); // Reset manual flag for next workout
        fetchWorkouts();
        fetchInsights();
      })
      .catch(error => console.error('Error logging workout:', error));
  };

  const deleteWorkout = (workoutId) => {
    axios.delete(`${API_BASE}/workouts/${workoutId}`)
      .then(() => {
        fetchWorkouts();
        fetchInsights();
      })
      .catch(error => console.error('Error deleting workout:', error));
  };

  const chartData = {
    labels: workouts.map(w => w.type),
    datasets: [{
      label: 'Calories Burned',
      data: workouts.map(w => w.calories),
      backgroundColor: 'rgba(139, 92, 246, 0.7)'
    }]
  };

  const workoutsByDateAndType = workouts.reduce((acc, workout) => {
    if (workout.timestamp) {
      const date = new Date(workout.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {};
      }
      if (!acc[date][workout.type]) {
        acc[date][workout.type] = 0;
      }
      acc[date][workout.type] += workout.calories;
    }
    return acc;
  }, {});

  const sortedDates = Object.keys(workoutsByDateAndType).sort((a, b) => new Date(a) - new Date(b));

  const workoutTypes = [...new Set(workouts.map(w => w.type))];

  const colors = [
    'rgba(139, 92, 246, 0.7)',    // Purple
    'rgba(168, 85, 247, 0.7)',    // Bright Purple
    'rgba(126, 34, 206, 0.7)',    // Deep Purple
    'rgba(16, 185, 129, 0.7)',    // Emerald
    'rgba(59, 130, 246, 0.7)',    // Blue
    'rgba(236, 72, 153, 0.7)'     // Pink
  ];

  const timeChartData = {
    labels: sortedDates,
    datasets: workoutTypes.map((type, index) => ({
      label: type,
      data: sortedDates.map(date => workoutsByDateAndType[date][type] || 0),
      backgroundColor: colors[index % colors.length]
    }))
  };

  const stackedOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true
      }
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
        Insights
      </h2>
      {insights && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          maxWidth: '600px',
          margin: '10px auto',
          fontSize: '16px'
        }}>
          {insights.message}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-around', gap: '20px', padding: '20px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{
            background: 'linear-gradient(135deg, #667eea 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '24px',
            fontWeight: '800',
            marginBottom: '20px',
            letterSpacing: '-0.5px'
          }}>
            Calories by Workout Type
          </h2>
          <Bar data={chartData} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{
            background: 'linear-gradient(135deg, #667eea 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '24px',
            fontWeight: '800',
            marginBottom: '20px',
            letterSpacing: '-0.5px'
          }}>
            Workouts Over Time
          </h2>
          <Bar data={timeChartData} options={stackedOptions} />
        </div>
      </div>
    </div>
  );
}

export default Home;
