import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { IconAlert } from './Icons';
import './App.css';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('signup'); // 'signup' or 'verify'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, confirmSignUp, signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password);

    if (result.success) {
      if (result.autoConfirm) {
        const signInResult = await signIn(email, password);
        if (signInResult.success) {
          navigate('/');
        } else {
          navigate('/login');
        }
      } else {
        setStep('verify');
      }
    } else {
      setError(result.error || 'Failed to sign up');
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await confirmSignUp(email, verificationCode);

    if (result.success) {
      // Auto sign in after verification
      const signInResult = await signIn(email, password);
      if (signInResult.success) {
        navigate('/');
      } else {
        navigate('/login');
      }
    } else {
      setError(result.error || 'Failed to verify');
    }
    setLoading(false);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">{step === 'signup' ? 'Create account' : 'Verify email'}</h1>
        <p className="auth-subtitle">
          {step === 'signup'
            ? 'Start tracking your workouts today'
            : 'Enter the verification code sent to your email'}
        </p>

        {error && (
          <div className="banner banner-error" role="alert">
            <IconAlert />
            <span>{error}</span>
          </div>
        )}

        {step === 'signup' ? (
          <form onSubmit={handleSignUp}>
            <div className="field">
              <label className="field-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="signup-confirm">Confirm password</label>
              <input
                id="signup-confirm"
                className="input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="field">
              <label className="field-label" htmlFor="verify-code">Verification code</label>
              <input
                id="verify-code"
                className="input"
                type="text"
                inputMode="numeric"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify email'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
