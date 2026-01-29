import { createContext, useContext, useState, useEffect } from 'react';
import { fetchAuthSession, signIn, signUp, signOut, confirmSignUp, getCurrentUser } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
    setLoading(false);
  }

  async function handleSignIn(email, password) {
    try {
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        await checkUser();
        return { success: true };
      }
      return { success: false, nextStep: result.nextStep };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function handleSignUp(email, password) {
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
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function getAuthToken() {
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
    signIn: handleSignIn,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    signOut: handleSignOut,
    getAuthToken
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
