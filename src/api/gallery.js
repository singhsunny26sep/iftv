// Gallery API (app-api.md §3). Gallery is public (no login).
// Media types: image / gif / video. Admin-ordered, never sorted client-side.
import { apiRequest } from './client';

// Cloudflare Images / CDN serve a smaller preview by swapping "/public" for
// "/thumbnail" at the end of the URL. Full-size opens on tap.
export const toThumbnail = (url) => {
  if (!url) return null;
  return String(url).replace(/\/public$/, '/thumbnail');
};

// app-api.md: "video: app mein yahi chalao" -> the hlsUrl is the playback URL.
export const toVideoSource = (url) => {
  if (!url) return null;
  return String(url);
};

// ---- 3.1 List ----
// 404 -> empty list (app-api.md: "Khali list = 404, error mat dikhao").
export async function getGallery({ page = 1, limit = 20, mediaType, tag, search } = {}) {
  let payload;
  try {
    payload = await apiRequest('/gallery/getAll', {
      method: 'GET',
      query: { page, limit, mediaType, tag, search },
    });
  } catch (e) {
    if (
      e.status === 404 &&
      /no any galleryitem found/i.test(e.message)
    ) {
      return { success: true, data: [], total: 0, totalPages: 0, page, limit };
    }
    throw e;
  }

  return {
    success: true,
    total: payload?.data?.total || 0,
    totalPages: payload?.data?.totalPages || 0,
    page: payload?.data?.page || page,
    limit: payload?.data?.limit || limit,
    data: formatGalleryItems(payload?.data?.data || []),
  };
}

const formatGalleryItems = (items) =>
  (Array.isArray(items) ? items : []).map(formatGalleryItem);

const formatDuration = (seconds) => {
  if (!seconds || Number.isNaN(Number(seconds))) return null;
  const s = Math.round(Number(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
};

const formatGalleryItem = (item) => {
  const mediaType = item?.mediaType || 'image';
  return {
    id: item._id || item.id,
    title: item.title || '',
    description: item.description || '',
    mediaType,
    // image/gif: full size preview url. video: the playback url (unused on web).
    media: toThumbnail(item.media) || null,
    // original full-resolution url — /public on Cloudflare Images. Used on tap.
    fullMedia: item.media || null,
    // video: hlsUrl is what the native player should open.
    hlsUrl: item.hlsUrl || null,
    poster: item.poster || null,
    thumbnailUrl: toThumbnail(item.thumbnailUrl || item.thumbnail || item.media),
    duration: mediaType === 'video' ? formatDuration(item.durationInSeconds) : null,
    tags: item.tags || [],
    createdAt: item.createdAt,
  };
};

// ---- 3.2 Single item (deep links / push) ----
export async function getGalleryItem(id) {
  const payload = await apiRequest(`/gallery/get/${encodeURIComponent(id)}`, {
    method: 'GET',
  });

  return { success: true, item: formatGalleryItem(payload?.data) };
}
