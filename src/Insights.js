import { useState, useEffect } from 'react';
import api from './api';
import { Line, Doughnut } from 'react-chartjs-2';
import './App.css';

function Insights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchInsights();
    fetchProfile();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await api.get('/insights/comprehensive');
      setInsights(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load insights');
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data && Object.keys(response.data).length > 0) {
        setUserProfile(response.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const gradientTitle = {
    background: 'linear-gradient(135deg, #667eea 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const cardStyle = {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  if (loading) {
    return (
      <div className="App">
        <h1 style={{ ...gradientTitle, fontSize: '48px', fontWeight: '900' }}>
          Loading Insights...
        </h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <h1 style={{ ...gradientTitle, fontSize: '48px', fontWeight: '900' }}>
          Insights
        </h1>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  const workoutFrequencyData = {
    labels: insights?.workout_frequency?.map(p => p.date) || [],
    datasets: [{
      label: 'Workouts',
      data: insights?.workout_frequency?.map(p => p.count) || [],
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  const caloriesOverTimeData = {
    labels: insights?.calories_over_time?.map(p => p.date) || [],
    datasets: [{
      label: 'Calories Burned',
      data: insights?.calories_over_time?.map(p => p.calories) || [],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  const workoutTypeColors = [
    'rgba(139, 92, 246, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(126, 34, 206, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
  ];

  const workoutTypeData = {
    labels: insights?.workout_type_breakdown?.map(t =>
      t.type.charAt(0).toUpperCase() + t.type.slice(1)
    ) || [],
    datasets: [{
      data: insights?.workout_type_breakdown?.map(t => t.count) || [],
      backgroundColor: workoutTypeColors,
      borderWidth: 2,
      borderColor: '#fff',
    }]
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const { week_comparison, streak, consistency_stats, weekly_progress } = insights || {};

  return (
    <div className="App">
      <h1 style={{ ...gradientTitle, fontSize: '48px', fontWeight: '900', marginBottom: '10px' }}>
        Your Fitness Insights
      </h1>
      <p style={{ color: '#666', fontSize: '18px', marginBottom: '30px', fontWeight: '500' }}>
        Track your progress and discover your fitness patterns
      </p>

      {/* Summary Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto 40px',
        padding: '0 20px'
      }}>
        {/* Weekly Goal Progress Card */}
        {weekly_progress && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 15px', color: '#333' }}>Weekly Goal</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6', margin: '0 0 10px' }}>
              {weekly_progress.current} / {weekly_progress.target}
            </p>
            <p style={{ color: '#666', margin: '0 0 15px' }}>{weekly_progress.unit}</p>
            <div style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#e0e0e0',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${weekly_progress.percentage}%`,
                height: '100%',
                background: weekly_progress.percentage >= 100
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>
        )}

        {/* Week Comparison Card */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px', color: '#333' }}>This Week vs Last Week</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Workouts:</span>
            <span style={{
              fontWeight: 'bold',
              color: week_comparison?.workout_change_percent >= 0 ? '#10b981' : '#ef4444'
            }}>
              {week_comparison?.this_week_workouts}
              ({week_comparison?.workout_change_percent >= 0 ? '+' : ''}
              {week_comparison?.workout_change_percent?.toFixed(0)}%)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Duration:</span>
            <span style={{
              fontWeight: 'bold',
              color: week_comparison?.duration_change_percent >= 0 ? '#10b981' : '#ef4444'
            }}>
              {week_comparison?.this_week_duration} min
              ({week_comparison?.duration_change_percent >= 0 ? '+' : ''}
              {week_comparison?.duration_change_percent?.toFixed(0)}%)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Calories:</span>
            <span style={{
              fontWeight: 'bold',
              color: week_comparison?.calories_change_percent >= 0 ? '#10b981' : '#ef4444'
            }}>
              {week_comparison?.this_week_calories} cal
              ({week_comparison?.calories_change_percent >= 0 ? '+' : ''}
              {week_comparison?.calories_change_percent?.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Streak Card */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px', color: '#333' }}>Workout Streak</h3>
          <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#f59e0b', margin: '0' }}>
            {streak?.current_streak || 0}
          </p>
          <p style={{ color: '#666', margin: '5px 0 15px' }}>day streak</p>
          <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
            Longest streak: {streak?.longest_streak || 0} days
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto 40px',
        padding: '0 20px'
      }}>
        {/* Workout Frequency Chart */}
        <div style={cardStyle}>
          <h3 style={{ ...gradientTitle, fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>
            Workout Frequency (Last 8 Weeks)
          </h3>
          <Line data={workoutFrequencyData} options={lineChartOptions} />
        </div>

        {/* Calories Over Time Chart */}
        <div style={cardStyle}>
          <h3 style={{ ...gradientTitle, fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>
            Calories Burned (Last 8 Weeks)
          </h3>
          <Line data={caloriesOverTimeData} options={lineChartOptions} />
        </div>
      </div>

      {/* Bottom Row: Type Breakdown and Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto 40px',
        padding: '0 20px'
      }}>
        {/* Workout Type Breakdown */}
        <div style={cardStyle}>
          <h3 style={{ ...gradientTitle, fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>
            Workout Type Breakdown
          </h3>
          {insights?.workout_type_breakdown?.length > 0 ? (
            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
              <Doughnut data={workoutTypeData} options={doughnutOptions} />
            </div>
          ) : (
            <p style={{ color: '#666', textAlign: 'center' }}>No workout data yet</p>
          )}
        </div>

        {/* Consistency Stats */}
        <div style={cardStyle}>
          <h3 style={{ ...gradientTitle, fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>
            Consistency Stats
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <span>Total Workouts</span>
              <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>{consistency_stats?.total_workouts || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <span>Total Duration</span>
              <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>{consistency_stats?.total_duration || 0} min</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <span>Total Calories</span>
              <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>{consistency_stats?.total_calories || 0} cal</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <span>Avg Workouts/Week</span>
              <span style={{ fontWeight: 'bold', color: '#10b981' }}>{consistency_stats?.avg_workouts_per_week || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <span>Avg Duration/Workout</span>
              <span style={{ fontWeight: 'bold', color: '#10b981' }}>{consistency_stats?.avg_duration_per_workout || 0} min</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <span>Most Active Day</span>
              <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{consistency_stats?.most_active_day || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <span>Favorite Workout</span>
              <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{consistency_stats?.favorite_workout_type || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Progress Section */}
      {userProfile?.target_weight && userProfile?.current_weight && (
        <div style={{ maxWidth: '600px', margin: '0 auto 40px', padding: '0 20px' }}>
          <div style={cardStyle}>
            <h3 style={{ ...gradientTitle, fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>
              Weight Progress
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 5px' }}>Current</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6', margin: 0 }}>
                  {userProfile.current_weight} lbs
                </p>
              </div>
              <div style={{ alignSelf: 'center', fontSize: '24px', color: '#ccc' }}>→</div>
              <div>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 5px' }}>Target</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                  {userProfile.target_weight} lbs
                </p>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
                {Math.abs(userProfile.current_weight - userProfile.target_weight)} lbs to go
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Insights;
