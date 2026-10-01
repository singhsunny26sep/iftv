import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import authService from '../api/auth';

const PlayerContext = createContext();

const BASE_URL = 'https://iftv.nvsricemart.com/iftv-ott';

// Mirrors the URL handling in api/movies.js so the player accepts the same
// absolute or relative paths the movie list produces.
function resolveVideoUrl(videoUrl) {
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
}

// Stream URLs on our own host need the bearer token attached.
export function buildVideoSource(url) {
  const resolved = resolveVideoUrl(url);
  if (!resolved) return null;
  const source = { uri: resolved };
  try {
    const token = authService.getCurrentUser()?.authToken;
    if (token && resolved.includes('iftv-ott.onrender.com')) {
      source.headers = { Authorization: `Bearer ${token}` };
    }
  } catch (e) {
    console.warn('Auth header not added:', e);
  }
  return source;
}

export const PlayerProvider = ({ children }) => {
  const [currentMovie, setCurrentMovie] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Bumping this forces the <Video> to remount, which is how a new source
  // (or a retry after an error) is applied.
  const [playerKey, setPlayerKey] = useState(0);

  const playMovie = useCallback((movie) => {
    if (!movie) return false;
    const source = buildVideoSource(movie.videoUrl || movie.url || movie.video);
    if (!source) return false;

    setCurrentMovie({ ...movie, videoUrl: source.uri });
    setIsPlaying(true);
    setPlayerKey(k => k + 1);
    return true;
  }, []);

  const pause = useCallback(() => setIsPlaying(false), []);
  const resume = useCallback(() => setIsPlaying(true), []);
  const togglePlayback = useCallback(
    () => setIsPlaying(prev => !prev),
    []
  );

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentMovie(null);
  }, []);

  const reload = useCallback(() => {
    setIsPlaying(true);
    setPlayerKey(k => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      currentMovie,
      isPlaying,
      playerKey,
      hasMovie: !!currentMovie,
      playMovie,
      pause,
      resume,
      togglePlayback,
      stop,
      reload,
    }),
    [
      currentMovie,
      isPlaying,
      playerKey,
      playMovie,
      pause,
      resume,
      togglePlayback,
      stop,
      reload,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export default PlayerContext;
