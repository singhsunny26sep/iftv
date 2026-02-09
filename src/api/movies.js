// Movie and Categories API functions for IFTV
const BASE_URL = 'https://iftv-ott.onrender.com/iftv-ott';

// Fetch all movies with pagination and filters
export async function fetchAllMovies(page = 1, limit = 10, releaseDate = null, languages = null) {
  try {
    let url = `${BASE_URL}/movies/getAll?page=${page}&limit=${limit}`;
    
    // Add optional parameters
    if (releaseDate) {
      url += `&releaseDate=${releaseDate}`;
    }
    if (languages) {
      url += `&languages=${languages}`;
    }

    console.log('Fetching movies from URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.status}`);
    }

    const result = await response.json();
    console.log('API Response:', result);
    
    // Handle the actual API response structure
    if (result.success && result.data) {
      return {
        movies: result.data.data || [],
        totalPages: result.data.totalPages || 1,
        currentPage: result.data.page || page,
        totalMovies: result.data.total || 0
      };
    } else {
      throw new Error(result.message || 'Failed to fetch movies');
    }
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
}

// Fetch movie categories
export async function fetchMovieCategories() {
  try {
    // First try the iftv-ott endpoint
    let response = await fetch(`${BASE_URL}/categories/getAll`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Fallback to the original endpoint with prefix
      response = await fetch(`${BASE_URL}/iftv-ott/categories/getAll`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response structures
    if (data.success && data.data) {
      // Check if data.data has the nested data array (pagination structure)
      if (Array.isArray(data.data)) {
        return data.data;
      } else if (data.data.data && Array.isArray(data.data.data)) {
        // Handle nested pagination structure: { data: { data: [...] } }
        return data.data.data;
      } else if (data.data.categories) {
        return data.data.categories;
      }
    } else if (data.categories) {
      return data.categories;
    } else if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return fallback categories
    return ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'];
  }
}

// Fetch featured movies (first 3 movies from the main list)
export async function fetchFeaturedMovies() {
  try {
    const data = await fetchAllMovies(1, 3);
    return data.movies.slice(0, 3);
  } catch (error) {
    console.error('Error fetching featured movies:', error);
    throw error;
  }
}

// Fetch trending movies (movies with high ratings or recent releases)
export async function fetchTrendingMovies() {
  try {
    // Fetch movies with a recent release date for trending effect
    const today = new Date().toISOString().split('T')[0];
    const data = await fetchAllMovies(1, 10, today);
    return data.movies;
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    throw error;
  }
}

// Fetch popular movies (first 10 from the list)
export async function fetchPopularMovies() {
  try {
    const data = await fetchAllMovies(1, 10);
    return data.movies;
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw error;
  }
}

// Utility function to format movie data for UI
export function formatMovieForUI(movie) {
  // Convert duration from seconds to minutes
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

  // Extract year from release date
  const extractYear = (dateString) => {
    if (!dateString) return new Date().getFullYear();
    return new Date(dateString).getFullYear();
  };

  return {
    id: movie._id || movie.id,
    title: movie.title || 'Unknown Title',
    thumbnail: movie.image || movie.thumbnail || movie.poster || 'https://via.placeholder.com/300x450/4A6BFF/FFFFFF?text=No+Image',
    videoUrl: movie.video || movie.videoUrl || movie.video_url || '',
    rating: movie.rating || movie.imdbRating || 0,
    year: extractYear(movie.releaseDate),
    genre: movie.categoryId || movie.genre || movie.categories?.join(', ') || 'Unknown',
    duration: formatDuration(movie.durationInSeconds),
    description: movie.description || movie.overview || '',
    casts: movie.casts || [],
    languages: movie.languages || [],
    releaseDate: movie.releaseDate,
  };
}
