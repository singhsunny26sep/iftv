// Shared HTTP client for every IFTV API.
//
// Centralises the things app-api.md says belong in one place:
//   - BASE_URL
//   - attaching the JWT (`Authorization: Bearer <token>`) to every request
//   - parsing the `{ success, data, message }` envelope
//   - the 401 "session expired" rule -> clear the token and bounce to login
import { Platform } from 'react-native';

import { BASE_URL, APP_VERSION } from './config';

// Token source. Imported lazily inside `request` so there is no ES module
// cycle: auth.js -> client.js -> auth.js must not evaluate at load time.
const getAuthToken = () => {
  try {
    const authService = require('./auth').default;
    return authService.getCurrentUser()?.authToken || null;
  } catch (e) {
    return null;
  }
};

// Set from AuthContext on mount. Called once for any 401/403 whose message
// indicates an expired or invalid session, so every consumer doesn't have to
// handle it individually.
let onSessionExpired = null;
export const setSessionExpiredHandler = (cb) => {
  onSessionExpired = cb;
};

export class APIError extends Error {
  constructor(message, { status, statusText, body } = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

const buildUrl = (path, query) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http')
    ? path
    : `${BASE_URL}${normalizedPath}`;

  const filtered = query
    ? Object.entries(query).filter(
        ([, v]) => v !== null && v !== undefined && v !== '',
      )
    : [];
  if (!filtered.length) return url;
  const qs = filtered
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${url}?${qs}`;
};

const buildHeaders = (opts) => {
  const headers = new Headers();
  // Do not set Content-Type for multipart bodies: let the native layer (or
  // FormData itself) generate the boundary, otherwise the request is rejected.
  const isFormData =
    typeof FormData !== 'undefined' && opts.body instanceof FormData;
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-Platform', Platform.OS);
  headers.set('X-App-Version', APP_VERSION);

  if (opts.authenticated !== false) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Per-request header overrides (e.g. an explicit Authorization header).
  if (opts.headers) {
    Object.entries(opts.headers).forEach(([k, v]) => {
      if (v === undefined || v === null) {
        headers.delete(k);
      } else {
        headers.set(k, String(v));
      }
    });
  }
  return headers;
};

const parseBody = (responseText) => {
  try {
    return JSON.parse(responseText);
  } catch (e) {
    return null;
  }
};

const mapError = (status, body) => {
  const message =
    body?.message ||
    body?.error ||
    `Request failed with status ${status}`;
  return new APIError(message, { status, body });
};

export async function request(path, {
  method = 'GET',
  body,
  query,
  authenticated = true,
  headers: reqHeaders,
  responseType, // 'json' (default) or 'text'
} = {}) {
  const url = buildUrl(path, query);
  const headers = buildHeaders({ authenticated, headers: reqHeaders });

  const init = { method, headers };
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      // Let the native layer set the multipart boundary.
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
    }
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (networkError) {
    throw new APIError('Network error or invalid response from server', {
      status: 0,
    });
  }

  const text = await response.text();
  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');
  const payload = isJson || responseType === 'json' ? parseBody(text) : text;

  if (!response.ok) {
    if (response.status === 401) {
      const msg = payload?.message || '';
      const sessionGone =
        response.status === 401 &&
        /expired|invalid authorization token format|access denied! missing authorization token|user not found/i.test(
          msg,
        );
      if (sessionGone && onSessionExpired) {
        onSessionExpired();
      }
    }
    throw mapError(response.status, payload);
  }

  return payload;
}

// Convenience helpers that unwrap the standard envelope. app-api.md says the
// contract on success is `{ success, data, message ... }`.
export async function apiRequest(path, options = {}) {
  const payload = await request(path, options);
  if (payload && typeof payload === 'object' && 'success' in payload && !payload.success) {
    throw new APIError(payload.message || 'Request failed', {
      status: payload.status || 0,
      body: payload,
    });
  }
  return payload;
}

export const api = {
  request,
  apiRequest,
  setSessionExpiredHandler,
  BASE_URL,
  APP_VERSION,
};

export default api;
