/**
 * Regression tests for the "Unresponsive app" Play Console rejection.
 *
 * The root cause was an infinite network/state loop: ProfileScreen refreshed the
 * profile from a useFocusEffect keyed on `refreshUser`, while `refreshUser` was
 * recreated on every render of AuthProvider. Each refresh produced a new `user`
 * object, which recreated `refreshUser`, which re-fired the effect — one HTTP
 * request plus a full-app re-render per network round trip, forever.
 */

import React, { useEffect } from 'react';
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

// AuthContext now persists the onboarding flag in AsyncStorage (native module).
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const authService = require('../src/api/auth').default;
const { AuthProvider, useAuth } = require('../src/contexts/AuthContext');

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const renderWithProvider = (ui) =>
  ReactTestRenderer.create(<AuthProvider>{ui}</AuthProvider>);

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
    user: { name: 'Tester', email: 'tester@example.com' },
  });
});

describe('AuthContext render stability', () => {
  it('does not re-trigger a focus effect that depends on refreshUser', async () => {
    const refreshCalls = [];
    let renders = 0;

    // Mirrors ProfileScreen: the effect identity depends on refreshUser.
    const Probe = () => {
      const { refreshUser } = useAuth();
      renders += 1;

      useEffect(() => {
        refreshCalls.push(1);
        refreshUser();
      }, [refreshUser]);

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

    // Before the fix this kept growing on every render, unboundedly.
    expect(refreshCalls.length).toBe(1);

    // And it must still be quiet: no extra request, no extra render, however
    // many times we let the event loop drain.
    const settledRenders = renders;
    const settledCalls = authService.getUser.mock.calls.length;
    for (let i = 0; i < 5; i += 1) {
      await flush();
    }
    expect(refreshCalls.length).toBe(1);
    expect(authService.getUser.mock.calls.length).toBe(settledCalls);
    expect(renders).toBe(settledRenders);
  });

  it('keeps the context value identity stable once settled', async () => {
    const valueIdentities = [];

    const Probe = () => {
      valueIdentities.push(useAuth());
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

    const settledRenders = valueIdentities.length;
    const settledIdentity = valueIdentities[settledRenders - 1];

    for (let i = 0; i < 5; i += 1) {
      await flush();
    }

    // Bootstrap may settle over several renders, but once quiet the value must
    // not be rebuilt — otherwise every useAuth() consumer re-renders for nothing.
    expect(valueIdentities.length).toBe(settledRenders);
    expect(valueIdentities[settledRenders - 1]).toBe(settledIdentity);
  });

  it('keeps every exposed function referentially stable', async () => {
    const seen = [];
    const Probe = () => {
      const { login, logout, checkAuth, refreshUser, updateProfile } = useAuth();
      seen.push({ login, logout, checkAuth, refreshUser, updateProfile });
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

    const first = seen[seen.length - 1];
    for (const later of seen.slice(Math.max(0, seen.length - 3))) {
      expect(later.login).toBe(first.login);
      expect(later.logout).toBe(first.logout);
      expect(later.checkAuth).toBe(first.checkAuth);
      expect(later.refreshUser).toBe(first.refreshUser);
      expect(later.updateProfile).toBe(first.updateProfile);
    }
  });

  it('refreshUser reads the token from the ref, not a stale closure', async () => {
    let captured;
    const Probe = () => {
      captured = useAuth().refreshUser;
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

    authService.getUser.mockClear();
    await act(async () => {
      const result = await captured();
      expect(result.success).toBe(true);
    });

    expect(authService.getUser).toHaveBeenCalledWith('token-123');
  });
});
