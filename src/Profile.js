import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useAuth } from './AuthContext';
import './App.css';

function Profile() {
  const { profileComplete, refreshProfileStatus } = useAuth();
  const navigate = useNavigate();
  const [isNewProfile, setIsNewProfile] = useState(!profileComplete);
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
          alert('Profile updated successfully!');
        }
      })
      .catch(error => {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
      });
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
        {isNewProfile ? 'Create Your Profile' : 'Your Profile'}
      </h1>
      <p style={{
        color: '#666',
        fontSize: '18px',
        marginBottom: '30px',
        fontWeight: '500'
      }}>
        {isNewProfile
          ? 'Complete your profile to get started with FitTrack'
          : 'Update your fitness profile'}
      </p>
      {isNewProfile && (
        <p style={{
          color: '#ef4444',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          * Required fields
        </p>
      )}
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>

        <div style={{ marginBottom: '20px' }}>
          <h3>Height {isNewProfile && <span style={{ color: '#ef4444' }}>*</span>}</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              name="heightFeet"
              type="number"
              value={profileData.heightFeet}
              onChange={handleChange}
              placeholder="Feet"
              required={isNewProfile}
              style={{ flex: 1, padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              name="heightInches"
              type="number"
              value={profileData.heightInches}
              onChange={handleChange}
              placeholder="Inches"
              style={{ flex: 1, padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Current Weight (lbs) {isNewProfile && <span style={{ color: '#ef4444' }}>*</span>}</h3>
          <input
            name="currentWeight"
            type="number"
            value={profileData.currentWeight}
            onChange={handleChange}
            placeholder="Weight in pounds"
            required={isNewProfile}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Age {isNewProfile && <span style={{ color: '#ef4444' }}>*</span>}</h3>
          <input
            name="age"
            type="number"
            value={profileData.age}
            onChange={handleChange}
            placeholder="Age"
            required={isNewProfile}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Sex</h3>
          <select
            name="sex"
            value={profileData.sex}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Goals</h3>
          <select
            name="goals"
            value={profileData.goals}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Select...</option>
            <option value="lose-weight">Lose Weight</option>
            <option value="gain-muscle">Gain Muscle</option>
            <option value="maintain">Maintain Weight</option>
            <option value="improve-endurance">Improve Endurance</option>
            <option value="general-fitness">General Fitness</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Target Weight (lbs)</h3>
          <input
            name="targetWeight"
            type="number"
            value={profileData.targetWeight}
            onChange={handleChange}
            placeholder="Target weight in pounds"
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Weekly Target</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <label style={{ flex: 1 }}>
              <input
                type="radio"
                name="weeklyTargetType"
                value="workouts"
                checked={profileData.weeklyTargetType === 'workouts'}
                onChange={handleChange}
              />
              {' '}Number of Workouts
            </label>
            <label style={{ flex: 1 }}>
              <input
                type="radio"
                name="weeklyTargetType"
                value="duration"
                checked={profileData.weeklyTargetType === 'duration'}
                onChange={handleChange}
              />
              {' '}Duration (minutes)
            </label>
          </div>
          <input
            name="weeklyTargetValue"
            type="number"
            value={profileData.weeklyTargetValue}
            onChange={handleChange}
            placeholder={profileData.weeklyTargetType === 'workouts' ? 'Number of workouts per week' : 'Total minutes per week'}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Goal Deadline</h3>
          <input
            name="goalDeadline"
            type="date"
            value={profileData.goalDeadline}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
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
          Lifestyle & Experience
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <h3>Current Workout Frequency</h3>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>How many times per week are you currently working out?</p>
          <input
            name="workoutFrequency"
            type="number"
            value={profileData.workoutFrequency}
            onChange={handleChange}
            placeholder="Times per week"
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
            min="0"
            max="7"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Daily Activity Level</h3>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Outside of workouts, how active is your daily routine?</p>
          <select
            name="activityLevel"
            value={profileData.activityLevel}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Select...</option>
            <option value="sedentary">Sedentary (Desk job, minimal movement)</option>
            <option value="lightly-active">Lightly Active (Some walking/standing)</option>
            <option value="moderately-active">Moderately Active (On feet most of day)</option>
            <option value="very-active">Very Active (Physical job, lots of movement)</option>
            <option value="extremely-active">Extremely Active (Heavy physical labor)</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Gym Experience Level</h3>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>How experienced are you with gym workouts and equipment?</p>
          <select
            name="gymExperience"
            value={profileData.gymExperience}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Select...</option>
            <option value="beginner">Beginner (New to working out)</option>
            <option value="novice">Novice (Less than 6 months experience)</option>
            <option value="intermediate">Intermediate (6 months - 2 years)</option>
            <option value="advanced">Advanced (2-5 years)</option>
            <option value="expert">Expert (5+ years)</option>
          </select>
        </div>

        <button type="submit" style={{ width: '100%', padding: '12px', fontSize: '16px', background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)', transition: 'all 0.3s ease' }}>
          {isNewProfile ? 'Create Profile & Get Started' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}

export default Profile;
