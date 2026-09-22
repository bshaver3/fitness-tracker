import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import './App.css';

function Profile() {
  const { profileComplete, refreshProfileStatus } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isNewProfile, setIsNewProfile] = useState(!profileComplete);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    heightFeet: '',
    heightInches: '',
    currentWeight: '',
    age: '',
    sex: '',
    goals: '',
    targetWeight: '',
    weeklyTargetType: 'workouts',
    weeklyTargetValue: '',
    goalDeadline: '',
    workoutFrequency: '',
    activityLevel: '',
    gymExperience: ''
  });

  useEffect(() => {
    // Fetch existing profile data
    api.get('/profile')
      .then(response => {
        if (response.data && Object.keys(response.data).length > 0) {
          const profile = response.data;
          setProfileData({
            heightFeet: profile.height_feet || '',
            heightInches: profile.height_inches || '',
            currentWeight: profile.current_weight || '',
            age: profile.age || '',
            sex: profile.sex || '',
            goals: profile.goals || '',
            targetWeight: profile.target_weight || '',
            weeklyTargetType: profile.weekly_target_type || 'workouts',
            weeklyTargetValue: profile.weekly_target_value || '',
            goalDeadline: profile.goal_deadline || '',
            workoutFrequency: profile.workout_frequency || '',
            activityLevel: profile.activity_level || '',
            gymExperience: profile.gym_experience || ''
          });
          // Check if profile has required fields filled
          if (profile.height_feet && profile.current_weight && profile.age) {
            setIsNewProfile(false);
          }
        }
      })
      .catch(error => console.error('Error fetching profile:', error));
  }, []);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    // Convert to backend field names (user_id is set by backend from auth token)
    const backendData = {
      height_feet: parseInt(profileData.heightFeet) || null,
      height_inches: parseInt(profileData.heightInches) || null,
      current_weight: parseInt(profileData.currentWeight) || null,
      age: parseInt(profileData.age) || null,
      sex: profileData.sex || null,
      goals: profileData.goals || null,
      target_weight: parseInt(profileData.targetWeight) || null,
      weekly_target_type: profileData.weeklyTargetType || null,
      weekly_target_value: parseInt(profileData.weeklyTargetValue) || null,
      goal_deadline: profileData.goalDeadline || null,
      workout_frequency: parseInt(profileData.workoutFrequency) || null,
      activity_level: profileData.activityLevel || null,
      gym_experience: profileData.gymExperience || null
    };

    api.post('/profile', backendData)
      .then(async () => {
        await refreshProfileStatus();
        if (isNewProfile) {
          setIsNewProfile(false);
          navigate('/');
        } else {
          showToast('Profile updated', 'success');
        }
      })
      .catch(error => {
        console.error('Error saving profile:', error);
        showToast('Error saving profile. Please try again.', 'error');
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="app-main">
      <div className="page-header">
        <h1 className="page-title">{isNewProfile ? 'Create your profile' : 'Your profile'}</h1>
        <p className="page-subtitle">
          {isNewProfile
            ? 'Complete your profile to get started with FitTrack.'
            : 'Update your fitness profile.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-panel" style={{ maxWidth: '600px' }}>
        {isNewProfile && (
          <p className="field-hint" style={{ marginTop: 0, marginBottom: 'var(--space-5)' }}>
            <span className="field-required">*</span> Required fields
          </p>
        )}

        <div className="field">
          <label className="field-label" htmlFor="heightFeet">
            Height {isNewProfile && <span className="field-required">*</span>}
          </label>
          <div className="field-row">
            <input
              id="heightFeet"
              className="input"
              name="heightFeet"
              type="number"
              value={profileData.heightFeet}
              onChange={handleChange}
              placeholder="Feet"
              required={isNewProfile}
            />
            <input
              className="input"
              name="heightInches"
              type="number"
              value={profileData.heightInches}
              onChange={handleChange}
              placeholder="Inches"
              aria-label="Height (inches)"
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="currentWeight">
            Current weight (lbs) {isNewProfile && <span className="field-required">*</span>}
          </label>
          <input
            id="currentWeight"
            className="input"
            name="currentWeight"
            type="number"
            value={profileData.currentWeight}
            onChange={handleChange}
            placeholder="Weight in pounds"
            required={isNewProfile}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="age">
            Age {isNewProfile && <span className="field-required">*</span>}
          </label>
          <input
            id="age"
            className="input"
            name="age"
            type="number"
            value={profileData.age}
            onChange={handleChange}
            placeholder="Age"
            required={isNewProfile}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="sex">Sex</label>
          <select id="sex" className="select" name="sex" value={profileData.sex} onChange={handleChange}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="goals">Goals</label>
          <select id="goals" className="select" name="goals" value={profileData.goals} onChange={handleChange}>
            <option value="">Select…</option>
            <option value="lose-weight">Lose weight</option>
            <option value="gain-muscle">Gain muscle</option>
            <option value="maintain">Maintain weight</option>
            <option value="improve-endurance">Improve endurance</option>
            <option value="general-fitness">General fitness</option>
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="targetWeight">Target weight (lbs)</label>
          <input
            id="targetWeight"
            className="input"
            name="targetWeight"
            type="number"
            value={profileData.targetWeight}
            onChange={handleChange}
            placeholder="Target weight in pounds"
          />
        </div>

        <div className="field">
          <span className="field-label">Weekly target</span>
          <div className="radio-row">
            <label className="radio-option">
              <input
                type="radio"
                name="weeklyTargetType"
                value="workouts"
                checked={profileData.weeklyTargetType === 'workouts'}
                onChange={handleChange}
              />
              Number of workouts
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="weeklyTargetType"
                value="duration"
                checked={profileData.weeklyTargetType === 'duration'}
                onChange={handleChange}
              />
              Duration (minutes)
            </label>
          </div>
          <input
            className="input"
            name="weeklyTargetValue"
            type="number"
            value={profileData.weeklyTargetValue}
            onChange={handleChange}
            placeholder={profileData.weeklyTargetType === 'workouts' ? 'Number of workouts per week' : 'Total minutes per week'}
            aria-label="Weekly target value"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="goalDeadline">Goal deadline</label>
          <input
            id="goalDeadline"
            className="input"
            name="goalDeadline"
            type="date"
            value={profileData.goalDeadline}
            onChange={handleChange}
          />
        </div>

        <h2 className="section-heading" style={{ fontSize: 'var(--step-lg)', marginTop: 'var(--space-8)' }}>
          Lifestyle &amp; experience
        </h2>

        <div className="field">
          <label className="field-label" htmlFor="workoutFrequency">Current workout frequency</label>
          <p className="field-hint" style={{ marginTop: '-2px' }}>How many times per week are you currently working out?</p>
          <input
            id="workoutFrequency"
            className="input"
            name="workoutFrequency"
            type="number"
            value={profileData.workoutFrequency}
            onChange={handleChange}
            placeholder="Times per week"
            min="0"
            max="7"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="activityLevel">Daily activity level</label>
          <p className="field-hint" style={{ marginTop: '-2px' }}>Outside of workouts, how active is your daily routine?</p>
          <select id="activityLevel" className="select" name="activityLevel" value={profileData.activityLevel} onChange={handleChange}>
            <option value="">Select…</option>
            <option value="sedentary">Sedentary (desk job, minimal movement)</option>
            <option value="lightly-active">Lightly active (some walking/standing)</option>
            <option value="moderately-active">Moderately active (on feet most of day)</option>
            <option value="very-active">Very active (physical job, lots of movement)</option>
            <option value="extremely-active">Extremely active (heavy physical labor)</option>
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="gymExperience">Gym experience level</label>
          <p className="field-hint" style={{ marginTop: '-2px' }}>How experienced are you with gym workouts and equipment?</p>
          <select id="gymExperience" className="select" name="gymExperience" value={profileData.gymExperience} onChange={handleChange}>
            <option value="">Select…</option>
            <option value="beginner">Beginner (new to working out)</option>
            <option value="novice">Novice (less than 6 months experience)</option>
            <option value="intermediate">Intermediate (6 months – 2 years)</option>
            <option value="advanced">Advanced (2–5 years)</option>
            <option value="expert">Expert (5+ years)</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
          {saving ? 'Saving…' : isNewProfile ? 'Create profile & get started' : 'Update profile'}
        </button>
      </form>
    </div>
  );
}

export default Profile;
