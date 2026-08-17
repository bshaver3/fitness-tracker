import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAuthSession, signIn, signUp, signOut, confirmSignUp, getCurrentUser } from 'aws-amplify/auth';
import api from './api';

const AuthContext = createContext(null);
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const MOCK_AUTH = TRUE_VALUES.has((process.env.REACT_APP_MOCK_AUTH || '').trim().toLowerCase());
const MOCK_USER = {
  username: 'local-dev-user',
  userId: 'local-dev-user',
  signInDetails: {
    loginId: 'local@example.com'
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  const checkProfileStatus = useCallback(async () => {
    try {
      const response = await api.get('/profile');
      // Profile is complete if it exists and has required fields
      const profile = response.data;
      const isComplete = profile &&
        profile.height_feet &&
        profile.current_weight &&
        profile.age;
      setProfileComplete(isComplete);
      return isComplete;
    } catch (error) {
      setProfileComplete(false);
      return false;
    }
  }, []);

  const checkUser = useCallback(async () => {
    if (MOCK_AUTH) {
      setUser(MOCK_USER);
      await checkProfileStatus();
      setLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      await checkProfileStatus();
    } catch (error) {
      setUser(null);
      setProfileComplete(false);
    }
    setLoading(false);
  }, [checkProfileStatus]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  async function handleSignIn(email, password) {
    setLoading(true);

    if (MOCK_AUTH) {
      setUser({
        ...MOCK_USER,
        username: email || MOCK_USER.username,
        signInDetails: {
          loginId: email || MOCK_USER.signInDetails.loginId
        }
      });
      await checkProfileStatus();
      setLoading(false);
      return { success: true };
    }

    try {
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        await checkProfileStatus();
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: false, nextStep: result.nextStep };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  }

  async function handleSignUp(email, password) {
    if (MOCK_AUTH) {
      return { success: true, autoConfirm: true };
    }

    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email }
        }
      });
      return { success: true, nextStep: result.nextStep };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function handleConfirmSignUp(email, code) {
    if (MOCK_AUTH) {
      return { success: true };
    }

    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function handleSignOut() {
    if (MOCK_AUTH) {
      setUser(null);
      setProfileComplete(false);
      return;
    }

    try {
      await signOut();
      setUser(null);
      setProfileComplete(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function getAuthToken() {
    if (MOCK_AUTH) {
      return null;
    }

    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch (error) {
      return null;
    }
  }

  const value = {
    user,
    loading,
    profileComplete,
    signIn: handleSignIn,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    signOut: handleSignOut,
    getAuthToken,
    refreshProfileStatus: checkProfileStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
