// Movie and Categories API functions for IFTV (app-api.md §5).
import { apiRequest } from './client';
import { BASE_URL } from './config';

const resolveVideoUrl = (videoUrl) => {
  if (!videoUrl || typeof videoUrl !== 'string') return '';
  const trimmed = videoUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('cloudflarestream.com') && trimmed.includes('/watch')) {
      return trimmed.replace(/\/watch$/, '/manifest/video.m3u8');
    }
    return trimmed;
  }
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${BASE_URL}${trimmed}`;
  return `${BASE_URL}/${trimmed}`;
};

// Fetch all movies with pagination and filters
export async function fetchAllMovies(page = 1, limit = 10, releaseDate = null, languages = null, categoryId = null, accessType = null) {
  const payload = await apiRequest('/movies/getAll', {
    method: 'GET',
    query: { page, limit, releaseDate, languages, categoryId, accessType },
  });

  return {
    movies: (payload?.data?.data || []).map(formatMovieForUI),
    totalPages: payload?.data?.totalPages || 1,
    currentPage: payload?.data?.page || page,
    totalMovies: payload?.data?.total || 0,
  };
}

// Fetch a single movie by id (app-api.md §5: GET /movies/:id/get)
export async function fetchMovieById(id) {
  const payload = await apiRequest(`/movies/${encodeURIComponent(id)}/get`, {
    method: 'GET',
  });
  return {
    ...payload,
    data: payload?.data ? formatMovieForUI(payload.data) : null,
  };
}

// Fetch movie categories
export async function fetchMovieCategories() {
  const payload = await apiRequest('/categories/getAll', { method: 'GET' });
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
}

// Fetch featured movies (first 3 movies from the main list)
export async function fetchFeaturedMovies() {
  const data = await fetchAllMovies(1, 3);
  return data.movies.slice(0, 3);
}

// Fetch trending movies (movies with high ratings or recent releases)
export async function fetchTrendingMovies() {
  const today = new Date().toISOString().split('T')[0];
  const data = await fetchAllMovies(1, 10, today);
  return data.movies;
}

// Fetch popular movies (first 10 from the list)
export async function fetchPopularMovies() {
  const data = await fetchAllMovies(1, 10);
  return data.movies;
}

// Free/paid lock helpers (app-api.md §5)
export const LockReason = {
  LOGIN_REQUIRED: 'login_required',
  SUBSCRIPTION_REQUIRED: 'subscription_required',
  PLAN_NOT_INCLUDED: 'plan_not_included',
};

export const isMoviePlayable = (movie) => {
  if (!movie) return false;
  return !movie.isLocked && !!movie.videoUrl;
};

// Format the CTA the doc prescribes for a locked movie.
export const lockCallToAction = (movie) => {
  if (!movie?.isLocked) return null;
  switch (movie.lockReason) {
    case LockReason.LOGIN_REQUIRED:
      return { label: 'Login karke dekho', action: 'login' };
    case LockReason.SUBSCRIPTION_REQUIRED:
      return { label: 'Premium', action: 'subscribe' };
    case LockReason.PLAN_NOT_INCLUDED:
      return { label: 'Plan lo', action: 'subscribe' };
    default:
      return movie.isLocked ? { label: 'Locked', action: 'subscribe' } : null;
  }
};

// Utility function to format movie data for UI (app-api.md §5)
export function formatMovieForUI(movie) {
  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const extractYear = (dateString) => {
    if (!dateString) return new Date().getFullYear();
    return new Date(dateString).getFullYear();
  };

  const isLocked = !!movie.isLocked;
  return {
    id: movie._id || movie.id,
    title: movie.title || 'Unknown Title',
    thumbnail: movie.thumbnail || movie.image || movie.poster || 'https://placehold.co/300x450/4A6BFF/FFFFFF?text=No+Image',
    // Locked movies have video === null (do not try to play).
    videoUrl: isLocked ? null : resolveVideoUrl(movie.video || movie.videoUrl || movie.video_url || movie.streamingUrl || movie.url || ''),
    rating: movie.rating || movie.imdbRating || 0,
    year: extractYear(movie.releaseDate),
    genre: movie.categoryId || movie.genre || movie.categories?.join(', ') || 'Unknown',
    duration: formatDuration(movie.durationInSeconds),
    description: movie.description || movie.overview || '',
    casts: movie.casts || [],
    languages: movie.languages || [],
    releaseDate: movie.releaseDate,
    // Free / paid lock (app-api.md §5)
    accessType: movie.accessType || 'free',
    isLocked,
    lockReason: movie.lockReason || null,
    allowedPlans: movie.allowedPlans || [],
    availableInPlans: (movie.availableInPlans || []).map((p) => ({
      id: p._id || p.id,
      name: p.name,
      type: p.type,
      price: p.price,
      durationInDays: p.durationInDays,
      currency: p.currency || 'INR',
    })),
  };
}
