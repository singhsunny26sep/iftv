/**
 * Tests for the shared API client + auth wiring.
 *
 * These verify the pieces that app-api.md says must behave a specific way and
 * that are easy to get wrong:
 *   - the `{ success, data, message }` envelope is unwrapped,
 *   - the bearer token is attached on protected requests,
 *   - a 401 that means "expired/invalid" triggers the single session-expired
 *     handler exactly once.
 */
// AsyncStorage is a native module that Jest doesn't transform; stub it so the
// real auth.js can be loaded and exercised.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

import authService from '../src/api/auth';
import { api, APIError, setSessionExpiredHandler } from '../src/api/client';
import { toRupees } from '../src/api/subscriptions';

const BASE = api.BASE_URL;

afterEach(() => {
  if (typeof fetch.mockRestore === 'function') fetch.mockRestore();
  setSessionExpiredHandler(null);
  authService.logout();
});

const jsonResponse = (body, { status = 200 } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: 'OK',
  headers: { get: () => 'application/json' },
  text: () => Promise.resolve(JSON.stringify(body)),
});

describe('api client envelope + auth', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('unwraps the success envelope and returns `data`', async () => {
    fetch.mockResolvedValue(jsonResponse({
      success: true,
      message: 'ok',
      data: { hello: 'world' },
    }));

    const payload = await api.apiRequest('/movies/getAll', { method: 'GET' });
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({ hello: 'world' });
  });

  it('throws APIError on a failed envelope (success: false)', async () => {
    fetch.mockResolvedValue(jsonResponse({
      success: false,
      message: 'Something went wrong.',
    }, { status: 422 }));

    await expect(api.apiRequest('/x', { method: 'POST', body: {} })).rejects.toBeInstanceOf(APIError);
  });

  it('attaches the bearer token on protected requests', async () => {
    authService.userSession = { authToken: 'tok-123', mobileNumber: '9999999999' };
    fetch.mockResolvedValue(jsonResponse({ success: true, data: {} }));

    await api.apiRequest('/supports/my', { method: 'GET' });

    const [, init] = fetch.mock.calls[0];
    expect(init.headers.get('Authorization')).toBe('Bearer tok-123');
  });

  it('does not attach a token when authenticated: false', async () => {
    authService.userSession = { authToken: 'tok-123' };
    fetch.mockResolvedValue(jsonResponse({ success: true, data: {} }));

    await api.apiRequest('/auth/loginOrSignin-with-mobile', {
      method: 'POST',
      authenticated: false,
      body: { mobile: 9876543210 },
    });

    const [, init] = fetch.mock.calls[0];
    expect(init.headers.get('Authorization')).toBe(null);
  });

  it('triggers the session-expired handler on a 401', async () => {
    fetch.mockResolvedValue(jsonResponse({
      success: false,
      message: 'Your session has expired. Please log in again.',
    }, { status: 401 }));

    const handler = jest.fn();
    setSessionExpiredHandler(handler);

    await expect(api.apiRequest('/users/get', { method: 'GET' })).rejects.toBeInstanceOf(APIError);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire the handler on a 404', async () => {
    fetch.mockResolvedValue(jsonResponse({
      success: false,
      message: 'No any supportticket found',
    }, { status: 404 }));

    const handler = jest.fn();
    setSessionExpiredHandler(handler);

    await expect(api.apiRequest('/supports/my')).rejects.toBeInstanceOf(APIError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('forwards per-request headers (fixes getUser auth on Profile focus)', async () => {
    fetch.mockResolvedValue(jsonResponse({ success: true, data: {} }));

    await api.apiRequest('/users/get', {
      method: 'GET',
      authenticated: false,
      headers: { Authorization: 'Bearer tok-123' },
    });

    const [, init] = fetch.mock.calls[0];
    expect(init.headers.get('Authorization')).toBe('Bearer tok-123');
  });

  it('per-request headers override central defaults', async () => {
    authService.userSession = { authToken: 'central-token' };
    fetch.mockResolvedValue(jsonResponse({ success: true, data: {} }));

    await api.apiRequest('/users/get', {
      method: 'GET',
      authenticated: false,
      headers: { Authorization: 'Bearer explicit-token' },
    });

    const [, init] = fetch.mock.calls[0];
    expect(init.headers.get('Authorization')).toBe('Bearer explicit-token');
  });
});

describe('money helpers', () => {
  it('converts paise to rupees', () => {
    expect(toRupees(19900)).toBe('₹199.00');
    expect(toRupees(130001)).toBe('₹1300.01');
    expect(toRupees(undefined)).toBe('₹0.00');
  });
});
