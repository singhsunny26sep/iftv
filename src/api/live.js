// Live streaming API service
import { apiRequest } from './client';
import { BASE_URL } from './config';

// Resolve relative stream paths against the API host, and normalise HLS
// playlist URLs the same way the VOD player does.
function resolveStreamUrl(streamUrl) {
  if (!streamUrl || typeof streamUrl !== 'string') return '';
  const trimmed = streamUrl.trim();
  if (!trimmed) return '';
  if (trimmed.includes('cloudflarestream.com') && trimmed.includes('/watch')) {
    return trimmed.replace(/\/watch$/, '/manifest/video.m3u8');
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${BASE_URL}${trimmed}`;
  return `${BASE_URL}/${trimmed}`;
}

const getAuthToken = () => {
  try {
    const { default: authService } = require('./auth');
    return authService.getCurrentUser()?.authToken || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const parseJson = (responseText) => {
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    throw new Error('Invalid JSON response from server');
  }
};

// Pull the list out of the several shapes the API has used elsewhere
// ({data:[...]}, {data:{data:[...]}}, {channels:[...]}, bare [...]).
function extractList(payload, ...keys) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.channels)) return data.channels;
  if (Array.isArray(data?.streams)) return data.streams;
  return [];
}

class LiveService {
  // Fetch live streams. Returns [] when the backend has no live catalogue
  // yet, so callers can render an empty state instead of erroring.
  async getAllLiveStreams(page = 1, limit = 20, categoryId = null) {
    try {
      let url = `${BASE_URL}/live/getAll?page=${page}&limit=${limit}`;
      if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }

      const token = getAuthToken();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      const payload = parseJson(await response.text());

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || `Failed to fetch live streams: ${response.status}`);
      }

      return extractList(payload, 'streams', 'liveStreams').map(formatLiveStreamForUI);
    } catch (error) {
      // A missing live endpoint should degrade to "no live TV", not an error
      // screen, so 404s are swallowed and everything else is surfaced.
      if (error?.message?.includes('Failed to fetch live streams: 404')) {
        console.warn('Live streaming endpoint not available on the backend yet');
        return [];
      }
      console.error('Error fetching live streams:', error);
      throw error;
    }
  }

  // Categories used by the filter chips.
  async getLiveCategories() {
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/live/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      const payload = parseJson(await response.text());

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || `Failed to fetch categories: ${response.status}`);
      }

      return extractList(payload, 'categories');
    } catch (error) {
      console.error('Error fetching live categories:', error);
      return [];
    }
  }
}

// Normalise a raw stream record into the shape the UI renders.
export function formatLiveStreamForUI(stream) {
  return {
    id: stream._id || stream.id,
    title: stream.title || stream.name || stream.channelName || 'Live Channel',
    thumbnail: stream.thumbnail || stream.image || stream.poster || stream.logo || null,
    streamUrl: resolveStreamUrl(
      stream.streamUrl || stream.url || stream.video || stream.playbackUrl || stream.hlsUrl
    ),
    category: stream.category || stream.categoryName || stream.genre || 'Entertainment',
    language: stream.language || null,
    viewers: stream.viewers ?? stream.viewerCount ?? stream.liveViewers ?? null,
    isLive: stream.isLive !== false,
    description: stream.description || '',
    startedAt: stream.startedAt || null,
  };
}

export default new LiveService();