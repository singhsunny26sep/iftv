/**
 * Regression tests for the OTP login flow (app-api.md §1.1-1.2).
 *
 * Guards the two things that were broken before:
 *   - "login nhi ho rha tha": sendOTP was renamed away from what LoginScreen
 *     and OTPVerification called, so OTP sending threw.
 *   - resend returned a new sessionId that was never saved, so verify used the
 *     stale one and the server answered "OTP not found" / "Invalid OTP".
 */
import authService from '../src/api/auth';

jest.mock('../src/api/client', () => ({
  __esModule: true,
  apiRequest: jest.fn(),
  setSessionExpiredHandler: jest.fn(),
  APIError: class extends Error {
    constructor(m, opts = {}) {
      super(m);
      this.status = opts.status;
      this.body = opts.body;
    }
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

const client = require('../src/api/client');

const install = (impl) => {
  client.apiRequest.mockImplementation(impl);
};

describe('auth service OTP flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendOTP still exists and sends a numeric mobile with loginType', async () => {
    install((path) => {
      if (path === '/auth/loginOrSignin-with-mobile') {
        return Promise.resolve({
          success: true,
          message: 'OTP has been sent to your Mobile. Please check your inbox.',
          data: {
            otpData: { Status: 'Success', Details: 'session-v2' },
            isFirst: false,
          },
        });
      }
      return Promise.resolve({ success: true, data: {} });
    });

    const res = await authService.sendOTP('9876543210');
    expect(typeof authService.sendOTP).toBe('function');
    expect(res.sessionId).toBe('session-v2');
    expect(res.isFirst).toBe(false);

    const [path, opts] = client.apiRequest.mock.calls[0];
    expect(path).toBe('/auth/loginOrSignin-with-mobile');
    expect(opts.method).toBe('POST');
    expect(opts.body).toEqual({
      mobile: 9876543210,
      role: 'user',
      loginType: 'mobile',
    });
  });

  it('verifyOTP saves the session and returns the token', async () => {
    install((path) => {
      if (path === '/auth/verify-otp-mobile') {
        return Promise.resolve({
          success: true,
          data: { token: 'tok', user: { name: 'Tester' }, isFirst: false },
        });
      }
      return Promise.resolve({ success: true, data: {} });
    });

    const res = await authService.verifyOTP('9876543210', '123456', 'session-v2', {
      currentScreen: 'HOME_SCREEN',
    });
    expect(res.token).toBe('tok');
    expect(res.user).toEqual({ name: 'Tester' });
    expect(authService.getCurrentUser().authToken).toBe('tok');
    expect(authService.isAuthenticated()).toBe(true);

    const [, opts] = client.apiRequest.mock.calls[0];
    expect(opts.method).toBe('PUT');
    expect(opts.body).toMatchObject({
      sessionId: 'session-v2',
      otp: '123456',
      mobile: 9876543210,
      loginType: 'mobile',
      currentScreen: 'HOME_SCREEN',
    });
  });
});
