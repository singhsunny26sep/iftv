// Support tickets API (app-api.md §2).
// All endpoints require the bearer token, which the shared client attaches.
import { Platform } from 'react-native';
import { apiRequest } from './client';
import { APP_VERSION } from './config';

const PLATFORM = Platform.OS; // "android" | "ios"

// Convert a gallery/support image URL from "/public" to "/thumbnail".
// Cloudflare Images (and our image CDN) serve a smaller variant this way and it
// is cheap enough for grid previews; tap opens the "/public" full version.
export const toThumbnail = (url) => {
  if (!url) return null;
  return String(url).replace(/\/public$/, '/thumbnail');
};

const toFormData = (fields, fileFields) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, String(value));
  });
  (fileFields || []).forEach(({ name, uri, type, fileName }) => {
    const ext = (fileName || '').split('.').pop() || 'jpg';
    form.append(name, {
      uri,
      name: fileName || `${Date.now()}.${ext}`,
      type: type || `image/${ext === 'jpeg' ? 'jpeg' : ext}`,
    });
  });
  return form;
};

// ---- 2.1 Create a ticket ----
// attachments: array of { uri, name?, type? } (0-3), images only (.jpg/.jpeg/.png/.webp).
export async function createTicket({
  category,
  subject,
  message,
  attachments,
  platform = PLATFORM,
  appVersion = APP_VERSION,
}) {
  const form = toFormData(
    { category, subject, message, platform, appVersion },
    (attachments || []).map((a, i) => ({
      name: 'attachments',
      uri: a.uri,
      type: a.type,
      fileName: a.name,
    })),
  );

  const payload = await apiRequest('/supports/create', {
    method: 'POST',
    body: form,
  });

  return { success: true, ticket: payload?.data };
}

// ---- 2.2 My tickets ----
export async function getMyTickets({ page = 1, limit = 10, status } = {}) {
  const payload = await apiRequest('/supports/my', {
    method: 'GET',
    query: { page, limit, status },
  });

  // app-api.md: empty list is a 404 ("No any supportticket found"), which the
  // client turns into an APIError. Surface it as an empty result instead.
  if (payload?.success === false && /no any supportticket found/i.test(payload.message)) {
    return { success: true, data: [], total: 0, totalPages: 0, page, limit };
  }

  return {
    success: true,
    total: payload?.data?.total || 0,
    totalPages: payload?.data?.totalPages || 0,
    page: payload?.data?.page || page,
    limit: payload?.data?.limit || limit,
    data: payload?.data?.data || [],
  };
}

// ---- 2.3 Ticket detail + thread ----
export async function getTicket(id) {
  const payload = await apiRequest(`/supports/get/${encodeURIComponent(id)}`, {
    method: 'GET',
  });

  return { success: true, ticket: payload?.data };
}

// ---- 2.4 Reply to a ticket ----
export async function replyToTicket(id, { message, attachments }) {
  const form = toFormData({ message }, (attachments || []).map((a) => ({
    name: 'attachments',
    uri: a.uri,
    type: a.type,
    fileName: a.name,
  })));

  const payload = await apiRequest(`/supports/reply/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: form,
  });

  return { success: true, ticket: payload?.data };
}

// ---- 2.5 Close a ticket ----
export async function closeTicket(id) {
  const payload = await apiRequest(`/supports/close/${encodeURIComponent(id)}`, {
    method: 'PUT',
  });

  return { success: true, ticket: payload?.data };
}
