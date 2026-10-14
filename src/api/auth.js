// Authentication API service (app-api.md §1).
//
// The server treats login + sign-up as one flow: if the mobile number isn't
// recognised it creates the account and returns `isFirst: true`.
//
// Token is a 7-day JWT stored via this service. The shared client
// (api/client.js) injects it on every protected request and handles 401s in
// one place, so callers here only need to pass the token for the legacy
// in-memory session that AuthContext reads on bootstrap.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './client';

const SESSION_KEY = '@iftv:authSession';

class AuthService {
  constructor() {
    this.userSession = null;
  }

  // ---- Session persistence (AsyncStorage) ----
  // NOTE: app-api.md asks for EncryptedSharedPreferences / Keychain. That needs
  // a native secure-storage dependency. Kept on AsyncStorage for now to stay
  // build-compatible; swap the storage calls below for a secure module when one
  // is added.

  async persistSession() {
    if (!this.userSession) return;
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(this.userSession));
    } catch (error) {
      console.error('Error persisting session:', error);
    }
  }

  async restoreSession() {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      // A session without a token is useless and should be discarded.
      if (!session?.authToken) {
        await AsyncStorage.removeItem(SESSION_KEY);
        return null;
      }
      this.userSession = session;
      return session;
    } catch (error) {
      console.error('Error restoring session:', error);
      return null;
    }
  }

  updateCurrentUser(updates) {
    if (!this.userSession) {
      return null;
    }
    this.userSession = {
      ...this.userSession,
      ...updates,
      user: {
        ...(this.userSession.user || {}),
        ...(updates && updates.user ? updates.user : updates),
      },
    };
    this.persistSession();
    return this.userSession;
  }

  logout() {
    this.userSession = null;
    AsyncStorage.removeItem(SESSION_KEY).catch((error) => {
      console.error('Error clearing stored session:', error);
    });
  }

  getCurrentUser() {
    return this.userSession;
  }

  isAuthenticated() {
    return !!this.userSession?.authToken;
  }

  // ---- 1.1 Mobile OTP ----
  async sendOTP(mobileNumber, role = 'user') {
    if (!/^\d{10}$/.test(String(mobileNumber).replace(/\s/g, ''))) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    const payload = await apiRequest('/auth/loginOrSignin-with-mobile', {
      method: 'POST',
      authenticated: false,
      body: {
        // The API expects a numeric mobile (e.g. 9876543210), per app-api.md.
        mobile: Number(String(mobileNumber).replace(/\s/g, '')),
        role,
        loginType: 'mobile',
      },
    });

    const sessionId = payload?.data?.otpData?.Details;
    return {
      success: true,
      message: payload?.message || 'OTP sent successfully',
      sessionId,
      isFirst: payload?.data?.isFirst,
    };
  }

  // ---- 1.2 Mobile OTP verify ----
  async verifyOTP(mobileNumber, otp, sessionId, extra = {}) {
    if (!/^\d{10}$/.test(String(mobileNumber).replace(/\s/g, ''))) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }
    if (!/^\d{6}$/.test(String(otp))) {
      throw new Error('Please enter a valid 6-digit OTP');
    }

    const payload = await apiRequest('/auth/verify-otp-mobile', {
      method: 'PUT',
      authenticated: false,
      body: {
        sessionId,
        mobile: Number(String(mobileNumber).replace(/\s/g, '')),
        otp,
        role: 'user',
        loginType: 'mobile',
        currentScreen: extra.currentScreen || 'HOME_SCREEN',
        fcmToken: extra.fcmToken || undefined,
      },
    });

    const token = payload?.data?.token;
    const user = payload?.data?.user;
    const isFirst = payload?.data?.isFirst;

    if (token) {
      this.userSession = {
        mobileNumber,
        authToken: token,
        loginTime: new Date().toISOString(),
        isFirst,
        user,
      };
      await this.persistSession();
    }

    return {
      success: true,
      message: payload?.message || 'OTP verified successfully',
      token,
      user,
      isFirst,
    };
  }

  // ---- 1.3 Email OTP ----
  async sendEmailOTP(email) {
    const payload = await apiRequest('/auth/loginOrSignin-with-email', {
      method: 'POST',
      authenticated: false,
      body: { email, role: 'user', loginType: 'email' },
    });

    return {
      success: true,
      message: payload?.message || 'OTP sent to your email',
      isFirst: payload?.data?.isFirst,
    };
  }

  // ---- 1.4 Email OTP verify ----
  async verifyEmailOTP(email, otp, extra = {}) {
    const payload = await apiRequest('/auth/verify-otp-email', {
      method: 'PUT',
      authenticated: false,
      body: {
        email,
        // app-api.md: otp MUST be a string, otherwise the server always
        // answers "Invalid OTP".
        otp: String(otp),
        role: 'user',
        loginType: 'email',
        currentScreen: extra.currentScreen || 'HOME_SCREEN',
        fcmToken: extra.fcmToken || undefined,
      },
    });

    const token = payload?.data?.token;
    const user = payload?.data?.user;
    if (token) {
      this.userSession = {
        email,
        authToken: token,
        loginTime: new Date().toISOString(),
        user,
      };
      await this.persistSession();
    }

    return {
      success: true,
      message: payload?.message || 'OTP verified successfully',
      token,
      user,
    };
  }

  // app-api.md has no /users/get endpoint. The OTP verify response (1.2/1.4)
  // already returns the full user object, and verifyOTP stores it on the
  // session. Return that cached copy instead of hitting an undocumented path.
  // AuthContext calls this on bootstrap and on profile refresh, so keeping it
  // local avoids a 404 on every cold start and every tab focus.
  async getUser(_token) {
    const session = this.userSession || await this.restoreSession();
    if (!session?.authToken) {
      return { success: false, user: null };
    }
    return { success: true, user: session.user || {} };
  }
}

export default new AuthService();
