import { useState, useEffect } from 'react';
import api from './api';
import { Line, Doughnut } from 'react-chartjs-2';
import { IconArrowRight } from './Icons';
import './App.css';

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

  if (loading) {
    return (
      <div className="app-main">
        <div className="page-header">
          <h1 className="page-title">Your fitness insights</h1>
        </div>
        <div className="panel-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: '140px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-main">
        <div className="page-header">
          <h1 className="page-title">Insights</h1>
        </div>
        <div className="banner banner-error" role="alert">{error}</div>
      </div>
    );
  }

  const accentRGB = '232, 73, 31';
  const successRGB = '38, 138, 89';

  const workoutFrequencyData = {
    labels: insights?.workout_frequency?.map(p => p.date) || [],
    datasets: [{
      label: 'Workouts',
      data: insights?.workout_frequency?.map(p => p.count) || [],
      borderColor: `rgb(${accentRGB})`,
      backgroundColor: `rgba(${accentRGB}, 0.12)`,
      fill: true,
      tension: 0.35,
    }]
  };

  const caloriesOverTimeData = {
    labels: insights?.calories_over_time?.map(p => p.date) || [],
    datasets: [{
      label: 'Calories Burned',
      data: insights?.calories_over_time?.map(p => p.calories) || [],
      borderColor: `rgb(${successRGB})`,
      backgroundColor: `rgba(${successRGB}, 0.12)`,
      fill: true,
      tension: 0.35,
    }]
  };

  const workoutTypeColors = [
    'rgba(232, 73, 31, 0.85)',
    'rgba(255, 106, 61, 0.85)',
    'rgba(198, 56, 21, 0.85)',
    'rgba(38, 138, 89, 0.85)',
    'rgba(198, 122, 28, 0.85)',
    'rgba(122, 66, 45, 0.85)',
    'rgba(74, 66, 60, 0.85)',
    'rgba(180, 170, 161, 0.85)',
  ];

  const workoutTypeData = {
    labels: insights?.workout_type_breakdown?.map(t => capitalize(t.type)) || [],
    datasets: [{
      data: insights?.workout_type_breakdown?.map(t => t.count) || [],
      backgroundColor: workoutTypeColors,
      borderWidth: 2,
      borderColor: '#fffdfb',
    }]
  };

  const lineChartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  const { week_comparison, streak, consistency_stats, weekly_progress } = insights || {};
  const progressComplete = weekly_progress && weekly_progress.percentage >= 100;

  return (
    <div className="app-main">
      <div className="page-header">
        <h1 className="page-title">Your fitness insights</h1>
        <p className="page-subtitle">Track your progress and discover your fitness patterns.</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 'var(--space-10)' }}>
        {weekly_progress && (
          <div className="stat-card">
            <p className="stat-label">Weekly goal</p>
            <p className="stat-value">{weekly_progress.current} / {weekly_progress.target}</p>
            <p className="stat-unit">{weekly_progress.unit}</p>
            <div className="progress-track">
              <div
                className={`progress-fill${progressComplete ? ' complete' : ''}`}
                style={{ transform: `scaleX(${weekly_progress.percentage / 100})` }}
              />
            </div>
          </div>
        )}

        <div className="stat-card">
          <p className="stat-label">This week vs last week</p>
          <dl className="kv-list" style={{ marginTop: 'var(--space-2)' }}>
            <div className="kv-row" style={{ padding: '0.4rem 0', background: 'transparent' }}>
              <dt>Workouts</dt>
              <dd className={week_comparison?.workout_change_percent >= 0 ? 'stat-value positive' : 'stat-value negative'} style={{ fontSize: 'var(--step-sm)' }}>
                {week_comparison?.this_week_workouts} ({week_comparison?.workout_change_percent >= 0 ? '+' : ''}{week_comparison?.workout_change_percent?.toFixed(0)}%)
              </dd>
            </div>
            <div className="kv-row" style={{ padding: '0.4rem 0', background: 'transparent' }}>
              <dt>Duration</dt>
              <dd className={week_comparison?.duration_change_percent >= 0 ? 'stat-value positive' : 'stat-value negative'} style={{ fontSize: 'var(--step-sm)' }}>
                {week_comparison?.this_week_duration} min ({week_comparison?.duration_change_percent >= 0 ? '+' : ''}{week_comparison?.duration_change_percent?.toFixed(0)}%)
              </dd>
            </div>
            <div className="kv-row" style={{ padding: '0.4rem 0', background: 'transparent' }}>
              <dt>Calories</dt>
              <dd className={week_comparison?.calories_change_percent >= 0 ? 'stat-value positive' : 'stat-value negative'} style={{ fontSize: 'var(--step-sm)' }}>
                {week_comparison?.this_week_calories} cal ({week_comparison?.calories_change_percent >= 0 ? '+' : ''}{week_comparison?.calories_change_percent?.toFixed(0)}%)
              </dd>
            </div>
          </dl>
        </div>

        <div className="stat-card">
          <p className="stat-label">Workout streak</p>
          <p className="stat-value">{streak?.current_streak || 0}</p>
          <p className="stat-unit">day streak</p>
          <p className="stat-sub">Longest streak: {streak?.longest_streak || 0} days</p>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3 className="panel-title">Workout frequency (last 8 weeks)</h3>
          <Line data={workoutFrequencyData} options={lineChartOptions} />
        </div>
        <div className="panel">
          <h3 className="panel-title">Calories burned (last 8 weeks)</h3>
          <Line data={caloriesOverTimeData} options={lineChartOptions} />
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3 className="panel-title">Workout type breakdown</h3>
          {insights?.workout_type_breakdown?.length > 0 ? (
            <div style={{ maxWidth: '280px', margin: '0 auto' }}>
              <Doughnut data={workoutTypeData} options={doughnutOptions} />
            </div>
          ) : (
            <div className="empty-state">
              <p>No workout data yet</p>
            </div>
          )}
        </div>

        <div className="panel">
          <h3 className="panel-title">Consistency stats</h3>
          <dl className="kv-list">
            <div className="kv-row">
              <dt>Total workouts</dt>
              <dd>{consistency_stats?.total_workouts || 0}</dd>
            </div>
            <div className="kv-row">
              <dt>Total duration</dt>
              <dd>{consistency_stats?.total_duration || 0} min</dd>
            </div>
            <div className="kv-row">
              <dt>Total calories</dt>
              <dd>{consistency_stats?.total_calories || 0} cal</dd>
            </div>
            <div className="kv-row">
              <dt>Avg workouts/week</dt>
              <dd>{consistency_stats?.avg_workouts_per_week || 0}</dd>
            </div>
            <div className="kv-row">
              <dt>Avg duration/workout</dt>
              <dd>{consistency_stats?.avg_duration_per_workout || 0} min</dd>
            </div>
            <div className="kv-row">
              <dt>Most active day</dt>
              <dd>{consistency_stats?.most_active_day || 'N/A'}</dd>
            </div>
            <div className="kv-row">
              <dt>Favorite workout</dt>
              <dd>{consistency_stats?.favorite_workout_type ? capitalize(consistency_stats.favorite_workout_type) : 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {userProfile?.target_weight && userProfile?.current_weight && (
        <div className="panel" style={{ maxWidth: '480px' }}>
          <h3 className="panel-title">Weight progress</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <p className="stat-label">Current</p>
              <p className="stat-value" style={{ fontSize: 'var(--step-xl)' }}>{userProfile.current_weight} lbs</p>
            </div>
            <span style={{ color: 'var(--ink-300)' }}><IconArrowRight /></span>
            <div>
              <p className="stat-label">Target</p>
              <p className="stat-value positive" style={{ fontSize: 'var(--step-xl)' }}>{userProfile.target_weight} lbs</p>
            </div>
          </div>
          <p className="stat-sub" style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            {Math.abs(userProfile.current_weight - userProfile.target_weight)} lbs to go
          </p>
        </div>
      )}
    </div>
  );
}

export default Insights;
