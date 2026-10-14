import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import authService from '../api/auth';
import { setSessionExpiredHandler } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@iftv:onboardingCompleted';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // app-api.md §1: verify returns `isFirst: true` for a brand-new user, who
  // must complete onboarding before reaching Home. This preference is persisted
  // so we don't re-show onboarding on every app start after it's done.
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  // Mirror of `user` for callbacks that must keep a stable identity.
  // Every consumer of this context re-renders whenever `value` changes, so a
  // callback recreated on every `user` change would re-trigger any effect that
  // lists it as a dependency (useFocusEffect, useEffect, ...) forever.
  const userRef = useRef(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Load authentication state from auth service
  const loadAuthState = useCallback(async () => {
    try {
      // Reading storage is async, so this must be awaited before deciding
      // whether the user is signed in — otherwise a returning user would be
      // bounced to Login on every cold start.
      const currentUser = await authService.restoreSession();

      if (currentUser && currentUser.authToken) {
        let verified = true;
        try {
          // Fetch fresh user data from API
          const userResponse = await authService.getUser(currentUser.authToken);
          if (userResponse.success) {
            setUser({
              mobileNumber: currentUser.mobileNumber,
              token: currentUser.authToken,
              loginTime: currentUser.loginTime,
              ...userResponse.user, // Include all user fields from API
            });
            // Refresh the cached copy with what the server just returned.
            authService.updateCurrentUser({ user: userResponse.user });
          } else {
            // Fallback to stored data
            setUser({
              mobileNumber: currentUser.mobileNumber,
              token: currentUser.authToken,
              loginTime: currentUser.loginTime,
              ...(currentUser.user || {}),
            });
          }
        } catch (apiError) {
          // getUser threw — most likely a 401 from an expired/revoked token.
          // The client's 401 interceptor already cleared the stored session,
          // so re-check before deciding the user is still signed in.
          verified = authService.isAuthenticated();
        }
        // Only treat the user as authenticated if the session survived the
        // live verification above. This stops a stale token from keeping the
        // app stack in front of Login across cold starts.
        if (verified) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingCompleted(completed === 'true');
      } catch (e) {
        setOnboardingCompleted(true);
      }
      setLoading(false);
    }
   }, []);

  // Load authentication state on app start
  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  // Login function
  // `extra` carries OTP-verify-only fields from app-api.md §1.2:
  //   currentScreen, fcmToken.
  const login = useCallback(async (mobileNumber, otp, sessionId, extra = {}) => {
    try {
      const response = await authService.verifyOTP(mobileNumber, otp, sessionId, extra);

      // Fetch fresh user data from API using the token
      let userData;
      try {
        const userResponse = await authService.getUser(response.token);
        if (userResponse.success) {
          userData = {
            mobileNumber: mobileNumber,
            token: response.token,
            loginTime: new Date().toISOString(),
            ...userResponse.user // Include all user fields from API
          };
        } else {
          // Fallback to basic data
          userData = {
            mobileNumber: mobileNumber,
            token: response.token,
            loginTime: new Date().toISOString()
          };
        }
      } catch (apiError) {
        // Fallback to basic data
        userData = {
          mobileNumber: mobileNumber,
          token: response.token,
          loginTime: new Date().toISOString()
        };
      }

      setUser(userData);
      setIsAuthenticated(true);

      // app-api.md §1: a brand-new user (`isFirst`) must finish onboarding
      // before the app stack is shown. Returning users go straight to Home.
      setOnboardingRequired(response.isFirst === true);

      return {
        success: true,
        user: userData,
        isFirst: response.isFirst,
        needsOnboarding: response.isFirst === true,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Clear auth service session
      authService.logout();

      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      setOnboardingRequired(false);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Mark onboarding as done so new users reach Home on subsequent starts.
  const completeOnboarding = useCallback(async () => {
    setOnboardingCompleted(true);
    setOnboardingRequired(false);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.error('Error saving onboarding flag:', e);
    }
  }, []);

  // Check if user is authenticated
  const checkAuth = useCallback(() => {
    return authService.isAuthenticated();
  }, []);

  // Refresh user profile from API.
  // Deliberately reads the token from a ref instead of `user` so its identity
  // stays stable across renders: callers run this from focus effects, and a
  // changing identity would restart that effect on every refresh it triggers.
  const refreshUser = useCallback(async () => {
    const token = userRef.current?.token;
    if (!token) {
      return { success: false, error: 'No token available' };
    }
    try {
      const response = await authService.getUser(token);
      if (response.success) {
        setUser(prev => ({
          ...prev,
          ...response.user
        }));
        return { success: true };
      } else {
        return { success: false, error: 'Failed to refresh user' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Merge locally edited profile fields into the current session
  // The backend exposes no profile-update endpoint yet, so the values are
  // merged on top of the last known server response and re-fetched on refresh.
  const updateProfile = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') {
      return { success: false, error: 'Nothing to update' };
    }
    try {
      const session = authService.getCurrentUser();
      if (session) {
        authService.updateCurrentUser(updates);
      }
      setUser(prev => (prev ? { ...prev, ...updates } : prev));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Central 401 handling: the shared API client hands us 401s that mean the
  // token is gone/expired/invalid. One handler, in one place, logs the user
  // out — both from storage AND from React state, so the navigator swaps back
  // to the auth stack (Login) immediately instead of leaving the user stranded
  // on the app stack with a dead token.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout();
    });
  }, [logout]);

  // Stable object identity so unrelated state changes elsewhere in the tree
  // don't force every `useAuth()` consumer to re-render.
  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      onboardingCompleted,
      onboardingRequired,
      login,
      logout,
      completeOnboarding,
      checkAuth,
      refreshUser,
      updateProfile,
    }),
    [
      user,
      loading,
      isAuthenticated,
      onboardingCompleted,
      onboardingRequired,
      login,
      logout,
      completeOnboarding,
      checkAuth,
      refreshUser,
      updateProfile,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
