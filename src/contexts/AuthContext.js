import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/auth';
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load authentication state on app start
  useEffect(() => {
    loadAuthState();
  }, []);

  // Load authentication state from auth service
  const loadAuthState = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      console.log('Current user from authService:', currentUser);
      
      if (currentUser && currentUser.authToken) {
        console.log('Found stored session with token:', currentUser.authToken);
        
        // Fetch fresh user data from API
        try {
          const userResponse = await authService.getUser(currentUser.authToken);
          console.log('User profile response:', userResponse);
          if (userResponse.success) {
            setUser({
              mobileNumber: currentUser.mobileNumber,
              token: currentUser.authToken,
              loginTime: currentUser.loginTime,
              ...userResponse.user // Include all user fields from API
            });
          } else {
            // Fallback to stored data
            setUser({
              mobileNumber: currentUser.mobileNumber,
              token: currentUser.authToken,
              loginTime: currentUser.loginTime
            });
          }
        } catch (apiError) {
          console.error('Error fetching user profile:', apiError);
          // Fallback to stored data
          setUser({
            mobileNumber: currentUser.mobileNumber,
            token: currentUser.authToken,
            loginTime: currentUser.loginTime
          });
        }
        setIsAuthenticated(true);
      } else {
        console.log('No stored session found');
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (mobileNumber, otp, sessionId) => {
    try {
      setLoading(true);
      const response = await authService.verifyOTP(mobileNumber, otp, sessionId);
      
      console.log('Login response:', response);
      
      // Fetch fresh user data from API using the token
      let userData;
      try {
        const userResponse = await authService.getUser(response.token);
        console.log('User profile response:', userResponse);
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
        console.error('Error fetching user profile:', apiError);
        // Fallback to basic data
        userData = {
          mobileNumber: mobileNumber,
          token: response.token,
          loginTime: new Date().toISOString()
        };
      }

      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Clear auth service session
      authService.logout();
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const checkAuth = () => {
    return authService.isAuthenticated();
  };

  // Refresh user profile from API
  const refreshUser = async () => {
    if (!user?.token) {
      return { success: false, error: 'No token available' };
    }
    try {
      const response = await authService.getUser(user.token);
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
      console.error('Error refreshing user:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    refreshUser,
  };

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