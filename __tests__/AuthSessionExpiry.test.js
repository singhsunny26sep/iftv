/**
 * Regression test for the session-expiry rule:
 *   "until logout, the Login screen should not show."
 *
 * When the shared API client hits a 401 it must auto-logout (clear React
 * auth state, not just storage) so the navigator swaps back to Login. Before
 * the fix it only cleared storage and left `isAuthenticated` stuck on true,
 * stranding the user on the app stack with a dead token.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { act } from 'react-test-renderer';

jest.mock('../src/api/auth', () => ({
  __esModule: true,
  default: {
    restoreSession: jest.fn(),
    getUser: jest.fn(),
    updateCurrentUser: jest.fn(),
    verifyOTP: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn(() => true),
    getCurrentUser: jest.fn(() => ({ user: {} })),
  },
}));

jest.mock('../src/api/client', () => ({
  apiRequest: jest.fn(),
  setSessionExpiredHandler: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const authService = require('../src/api/auth').default;
const { setSessionExpiredHandler } = require('../src/api/client');
const { AuthProvider, useAuth } = require('../src/contexts/AuthContext');

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('Session expiry -> auto logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authService.isAuthenticated.mockReturnValue(true);
    authService.restoreSession.mockResolvedValue({
      authToken: 'token-123',
      mobileNumber: '9999999999',
      loginTime: '2026-01-01T00:00:00.000Z',
    });
    authService.getUser.mockResolvedValue({
      success: true,
      user: { name: 'Tester' },
    });
    setSessionExpiredHandler.mockClear();
  });

  it('registers a 401 handler and flips isAuthenticated to false when triggered', async () => {
    let latest;
    const Probe = () => {
      latest = useAuth();
      return null;
    };

    await act(async () => {
      ReactTestRenderer.create(
        <AuthProvider>
          <Probe />
        </AuthProvider>
      );
    });
    await flush();

    // Logged in after bootstrap.
    expect(latest.isAuthenticated).toBe(true);

    // The client must have registered a handler.
    expect(setSessionExpiredHandler).toHaveBeenCalledTimes(1);
    const registeredHandler = setSessionExpiredHandler.mock.calls[0][0];

    // Simulate a 401 from the shared client.
    await act(async () => {
      registeredHandler();
    });

    // The handler must clear storage AND flip React state, so Login returns.
    expect(authService.logout).toHaveBeenCalled();
    expect(latest.isAuthenticated).toBe(false);
  });

  it('stays authenticated while no 401 fires', async () => {
    let latest;
    const Probe = () => {
      latest = useAuth();
      return null;
    };

    await act(async () => {
      ReactTestRenderer.create(
        <AuthProvider>
          <Probe />
        </AuthProvider>
      );
    });
    await flush();
    await flush();

    expect(latest.isAuthenticated).toBe(true);
    expect(authService.logout).not.toHaveBeenCalled();
  });
});
