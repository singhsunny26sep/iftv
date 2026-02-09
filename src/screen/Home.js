import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import Video from 'react-native-video'
import { useNavigation } from '@react-navigation/native'
import {
  fetchAllMovies,
  fetchMovieCategories,
  formatMovieForUI
} from '../api/movies'

const { width, height } = Dimensions.get('window')

export default function Home() {
  const navigation = useNavigation()
  const [searchText, setSearchText] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [videoVisible, setVideoVisible] = useState(false)
  const [currentVideo, setCurrentVideo] = useState('')
  const [isVideoPaused, setIsVideoPaused] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [homeVideoLoaded, setHomeVideoLoaded] = useState(false)
  const [homeVideoError, setHomeVideoError] = useState(false)
  const videoRef = useRef(null)
  const homeVideoRef = useRef(null)

  // API Data States
  const [allMovies, setAllMovies] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch movies with your specific API parameters
      const [moviesData, categoriesData] = await Promise.allSettled([
        fetchAllMovies(1, 10, '2025-10-12', 'hindi'),
        fetchMovieCategories()
      ]);

      // Handle movies data
      if (moviesData.status === 'fulfilled') {
        console.log('Movies API Response:', moviesData.value);
        const formattedMovies = moviesData.value.movies.map(formatMovieForUI);
        console.log('Formatted Movies:', formattedMovies);
        setAllMovies(formattedMovies);
      } else {
        console.error('Failed to fetch movies:', moviesData.reason);
        setError('Failed to fetch movies. Please try again.');
      }

      // Handle categories
      if (categoriesData.status === 'fulfilled') {
        console.log('Categories API Response:', categoriesData.value);
        const apiCategories = categoriesData.value.map(cat =>
          typeof cat === 'string' ? cat : cat.name || cat.title || 'Unknown'
        );
        setCategories(['All', ...apiCategories]);
      } else {
        console.error('Failed to fetch categories:', categoriesData.reason);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // User profile data
  const userProfile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    membership: 'Premium',
    joinDate: 'January 2024',
    watchHistory: 47,
    favorites: 23,
    profileImage: 'https://via.placeholder.com/100x100/4A6BFF/FFFFFF?text=JD'
  }

  // Get the first movie for home page video
  const getHomePageVideo = () => {
    if (allMovies && allMovies.length > 0) {
      return allMovies[0];
    }
    return null;
  };

  const homePageVideo = getHomePageVideo();

  const handlePlayVideo = (videoUrl) => {
    console.log('Attempting to play video:', videoUrl);

    if (!videoUrl || videoUrl === '') {
      Alert.alert('Error', 'No video URL available for this movie.');
      return;
    }

    // Validate video URL format
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
      Alert.alert('Error', 'Invalid video URL format.');
      return;
    }

    setIsVideoLoading(true);
    setCurrentVideo(videoUrl);
    setVideoVisible(true);
    setIsVideoPaused(false);

    // Test video URL accessibility
    testVideoUrl(videoUrl);
  }

  const testVideoUrl = async (videoUrl) => {
    try {
      const response = await fetch(videoUrl, { method: 'HEAD' });
      console.log('Video URL test response:', response.status);
      if (!response.ok) {
        console.warn('Video URL might not be accessible:', response.status);
      }
    } catch (error) {
      console.warn('Video URL test failed:', error);
    }
  }

  const testVideoManually = async (videoUrl) => {
    console.log('Manual video test:', videoUrl);
    try {
      const response = await fetch(videoUrl, { method: 'GET' });
      console.log('Manual test response:', response.status, response.statusText);
      if (response.ok) {
        Alert.alert('Success', 'Video URL is accessible!');
      } else {
        Alert.alert('Error', `Video URL returned status: ${response.status}`);
      }
    } catch (error) {
      console.error('Manual test failed:', error);
      Alert.alert('Error', `Failed to access video URL: ${error.message}`);
    }
  }

  const closeVideo = () => {
    setVideoVisible(false);
    setCurrentVideo('');
    setIsVideoPaused(true);
    setIsVideoLoading(false);
  }

  const toggleVideoPause = () => {
    setIsVideoPaused(!isVideoPaused);
  }

  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setIsVideoLoading(false);
  }

  const handleVideoError = (error) => {
    console.log('Video error details:', error);
    console.log('Current video URL:', currentVideo);
    setIsVideoLoading(false);

    let errorMessage = 'Unable to play video. ';
    if (error.error && error.error.errorCode === -2) {
      errorMessage += 'This video format is not supported.';
    } else if (error.error && error.error.errorCode === -1) {
      errorMessage += 'Network error. Please check your internet connection.';
    } else {
      errorMessage += 'Please check your internet connection and try again.';
    }

    Alert.alert(
      'Playback Error',
      errorMessage,
      [
        { text: 'OK', onPress: closeVideo },
        {
          text: 'Retry', onPress: () => {
            closeVideo();
            setTimeout(() => handlePlayVideo(currentVideo), 1000);
          }
        }
      ]
    );
  }

  const handleVideoBuffer = ({ isBuffering }) => {
    console.log('Video buffering:', isBuffering);
  }

  // Home page video handlers
  const handleHomeVideoLoad = () => {
    console.log('Home page video loaded successfully');
    setHomeVideoLoaded(true);
    setHomeVideoError(false);

    // Auto-play the video after a short delay to ensure it's ready
    setTimeout(() => {
      if (homeVideoRef.current) {
        homeVideoRef.current.resume();
      }
    }, 500);
  }

  const handleHomeVideoError = (error) => {
    console.log('Home page video error:', error);
    setHomeVideoError(true);
    setHomeVideoLoaded(false);
  }

  const handleHomeVideoProgress = (progress) => {
    console.log('Home video progress:', progress.currentTime);
  }

  const renderFeaturedItem = ({ item }) => (
    <View style={styles.featuredItem}>
      <Image source={{ uri: item.thumbnail }} style={styles.featuredImage} />
      <View style={styles.featuredContent}>
        <Text style={styles.featuredTitle}>{item.title}</Text>
        <View style={styles.featuredInfo}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.featuredMeta}>{item.year} • {item.genre} • {item.duration}</Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => handlePlayVideo(item.videoUrl)}
        >
          <Icon name="play" size={20} color="#FFFFFF" />
          <Text style={styles.playButtonText}>Watch Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderTrendingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.trendingItem}
      onPress={() => handlePlayVideo(item.videoUrl)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.trendingImage} />
      <View style={styles.trendingOverlay}>
        <View style={styles.ratingBadge}>
          <Icon name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingBadgeText}>{item.rating}</Text>
        </View>
      </View>
      <View style={styles.playIconOverlay}>
        <Icon name="play-circle" size={40} color="#FFFFFF" />
      </View>
      <Text style={styles.trendingTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  )

  const renderPopularItem = ({ item }) => (
    <TouchableOpacity
      style={styles.popularItem}
      onPress={() => handlePlayVideo(item.videoUrl)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.popularImage} />
      <View style={styles.popularOverlay}>
        <View style={styles.ratingBadge}>
          <Icon name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingBadgeText}>{item.rating}</Text>
        </View>
      </View>
      <View style={styles.playIconOverlaySmall}>
        <Icon name="play-circle" size={30} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  )

  // Profile Modal Component
  const ProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showProfile}
      onRequestClose={() => setShowProfile(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.profileContainer}>
          {/* Header */}
          <View style={styles.profileHeader}>
            <Text style={styles.profileTitle}>My Profile</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProfile(false)}
            >
              <Icon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Image
              source={{ uri: userProfile.profileImage }}
              style={styles.profileLargeImage}
            />
            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userEmail}>{userProfile.email}</Text>

            <View style={styles.membershipBadge}>
              <Icon name="diamond" size={16} color="#FFD700" />
              <Text style={styles.membershipText}>{userProfile.membership} Member</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.watchHistory}</Text>
              <Text style={styles.statLabel}>Watched</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.favorites}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Watchlist</Text>
            </View>
          </View>

          {/* Menu Options */}
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem}>
              <Icon name="person-outline" size={20} color="#FFFFFF" />
              <Text style={styles.menuText}>Edit Profile</Text>
              <Icon name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Icon name="heart-outline" size={20} color="#FFFFFF" />
              <Text style={styles.menuText}>My Favorites</Text>
              <Icon name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Icon name="download-outline" size={20} color="#FFFFFF" />
              <Text style={styles.menuText}>Downloads</Text>
              <Icon name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Icon name="settings-outline" size={20} color="#FFFFFF" />
              <Text style={styles.menuText}>Settings</Text>
              <Icon name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton}>
            <Icon name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  // Video Player Modal - UPDATED VERSION
  const VideoPlayerModal = () => (
    <Modal
      animationType="slide"
      visible={videoVisible}
      statusBarTranslucent={true}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.videoContainer}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.videoCloseButton}
          onPress={closeVideo}
        >
          <Icon name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Video Player */}
        <View style={styles.videoPlayerContainer}>
          <Video
            ref={videoRef}
            source={{
              uri: currentVideo,
              headers: {
                'Accept': '*/*',
                'User-Agent': 'Mozilla/5.0 (compatible; ReactNativeVideo)',
              }
            }}
            style={styles.videoPlayer}
            paused={isVideoPaused}
            resizeMode="contain"
            controls={true}
            repeat={false}
            muted={false}
            volume={1.0}
            rate={1.0}
            poster="https://via.placeholder.com/300x200/4A6BFF/FFFFFF?text=Loading+Video"
            posterResizeMode="cover"
            onLoad={handleVideoLoad}
            onError={handleVideoError}
            onBuffer={handleVideoBuffer}
            onLoadStart={() => console.log('Video load started')}
            onProgress={(progress) => console.log('Video progress:', progress)}
            ignoreSilentSwitch="obey"
            playWhenInactive={false}
            playInBackground={false}
            bufferConfig={{
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500
            }}
            progressUpdateInterval={1000}
            selectedAudioTrack={{
              type: "auto",
            }}
            selectedTextTrack={{
              type: "auto",
            }}
          />

          {/* Loading Indicator */}
          {isVideoLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A6BFF" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}

          {/* Custom Play/Pause Overlay */}
          {!isVideoLoading && isVideoPaused && (
            <TouchableOpacity
              style={styles.playButtonOverlay}
              onPress={toggleVideoPause}
              activeOpacity={0.8}
            >
              <View style={styles.playButtonCircle}>
                <Icon name="play" size={50} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Video Controls */}
        <View style={styles.videoControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleVideoPause}
          >
            <Icon
              name={isVideoPaused ? "play" : "pause"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Icon name="heart-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Icon name="download-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A6BFF" />
          <Text style={styles.loadingText}>Loading movies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>IFTV HUB</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfile(true)}
          >
            <Image
              source={{ uri: userProfile.profileImage }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, TV shows..."
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                index === 0 && styles.categoryChipActive
              ]}
            >
              <Text style={[
                styles.categoryText,
                index === 0 && styles.categoryTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Home Page Video Player */}
        {homePageVideo && homePageVideo.videoUrl ? (
          <View style={styles.homeVideoSection}>
            <Text style={styles.homeVideoTitle}>Now Playing</Text>
            <View style={styles.homeVideoContainer}>
              {!homeVideoError ? (
                <>
                  <Video
                    ref={homeVideoRef}
                    source={{
                      uri: homePageVideo.videoUrl,
                      headers: {
                        'Accept': '*/*',
                        'User-Agent': 'Mozilla/5.0 (compatible; ReactNativeVideo)',
                      }
                    }}
                    style={styles.homeVideoPlayer}
                    controls={true}
                    resizeMode="cover"
                    paused={false}
                    repeat={false}
                    muted={false}
                    volume={1.0}
                    rate={1.0}
                    onLoad={handleHomeVideoLoad}
                    onError={handleHomeVideoError}
                    onBuffer={handleVideoBuffer}
                    onLoadStart={() => console.log('Home video load started')}
                    onProgress={handleHomeVideoProgress}
                    ignoreSilentSwitch="obey"
                    playWhenInactive={false}
                    playInBackground={false}
                    bufferConfig={{
                      minBufferMs: 15000,
                      maxBufferMs: 50000,
                      bufferForPlaybackMs: 2500
                    }}
                  />

                  {/* Loading overlay for home video */}
                  {!homeVideoLoaded && !homeVideoError && (
                    <View style={styles.homeVideoLoadingOverlay}>
                      <ActivityIndicator size="large" color="#4A6BFF" />
                      <Text style={styles.homeVideoLoadingText}>Loading video...</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.homeVideoErrorContainer}>
                  <Icon name="alert-circle-outline" size={48} color="#FF6B6B" />
                  <Text style={styles.homeVideoErrorText}>Unable to load video</Text>
                  <Text style={styles.homeVideoErrorSubtext}>Please check your internet connection</Text>
                </View>
              )}
            </View>
            <View style={styles.homeVideoInfo}>
              <Text style={styles.homeVideoMovieTitle}>{homePageVideo.title}</Text>
              <Text style={styles.homeVideoDescription}>{homePageVideo.description}</Text>
              <View style={styles.homeVideoMeta}>
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{homePageVideo.rating}</Text>
                </View>
                <Text style={styles.homeVideoDuration}>{homePageVideo.duration}</Text>
                <Text style={styles.homeVideoYear}>{homePageVideo.year}</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Fallback when no video is available */
          <View style={styles.homeVideoSection}>
            <Text style={styles.homeVideoTitle}>Featured Content</Text>
            <View style={styles.homeVideoContainer}>
              <View style={styles.homeVideoFallbackContainer}>
                <Icon name="play-circle-outline" size={64} color="#4A6BFF" />
                <Text style={styles.homeVideoFallbackTitle}>Welcome to IFTV</Text>
                <Text style={styles.homeVideoFallbackText}>Discover amazing movies and shows</Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.navigate('MovieList', {
                    movies: allMovies,
                    title: 'Browse All',
                    source: 'api'
                  })}
                >
                  <Text style={styles.browseButtonText}>Browse Movies</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Movies Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Movies</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MovieList', {
              movies: allMovies,
              title: 'Latest Movies',
              source: 'api'
            })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={allMovies}
            renderItem={renderFeaturedItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 40}
            decelerationRate="fast"
          />
        </View>

        {/* All Movies Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Movies</Text>
          </View>
          <FlatList
            data={allMovies}
            renderItem={renderPopularItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularList}
          />
        </View>

        {/* API Response Debug Section */}
        {__DEV__ && allMovies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Debug: API Data</Text>
            </View>
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                Total Movies: {allMovies.length}
              </Text>
              {allMovies.map((movie, index) => (
                <View key={movie.id} style={styles.debugMovieItem}>
                  <Text style={styles.debugMovieTitle}>{index + 1}. {movie.title}</Text>
                  <Text style={styles.debugMovieDetail}>ID: {movie.id}</Text>
                  <Text style={styles.debugMovieDetail}>Year: {movie.year}</Text>
                  <Text style={styles.debugMovieDetail}>Duration: {movie.duration}</Text>
                  <Text style={styles.debugMovieDetail}>Rating: {movie.rating}</Text>
                  <Text style={styles.debugMovieDetail}>Languages: {movie.languages?.join(', ')}</Text>
                  <Text style={styles.debugMovieDetail}>Video URL: {movie.videoUrl ? movie.videoUrl.substring(0, 50) + '...' : 'Not Available'}</Text>
                  <TouchableOpacity
                    style={styles.testVideoButton}
                    onPress={() => testVideoManually(movie.videoUrl)}
                  >
                    <Text style={styles.testVideoButtonText}>Test Video URL</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Continue Watching */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Watching</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.continueWatching}>
            <Text style={styles.emptyStateText}>
              Start watching something to see it here
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <ProfileModal />

      {/* Video Player Modal */}
      <VideoPlayerModal />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 12,
  },
  profileButton: {
    marginLeft: 12,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#4A6BFF',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  categoryChipActive: {
    backgroundColor: '#4A6BFF',
    borderColor: '#4A6BFF',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllText: {
    color: '#4A6BFF',
    fontSize: 14,
    fontWeight: '600',
  },
  featuredItem: {
    width: width - 40,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  featuredContent: {
    padding: 15,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featuredInfo: {
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  featuredMeta: {
    color: '#888',
    fontSize: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A6BFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  trendingList: {
    paddingHorizontal: 20,
  },
  trendingItem: {
    width: 140,
    marginRight: 15,
  },
  trendingImage: {
    width: 140,
    height: 200,
    borderRadius: 12,
  },
  trendingOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  trendingTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  popularList: {
    paddingHorizontal: 20,
  },
  popularItem: {
    marginRight: 12,
  },
  popularImage: {
    width: 110,
    height: 160,
    borderRadius: 8,
  },
  popularOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  playIconOverlaySmall: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  continueWatching: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  // Profile Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  profileContainer: {
    backgroundColor: '#0F0F1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  profileInfo: {
    alignItems: 'center',
    padding: 30,
  },
  profileLargeImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4A6BFF',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#888',
    marginBottom: 15,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 107, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A6BFF',
  },
  membershipText: {
    color: '#4A6BFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  menuText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Video Player Styles - UPDATED
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  videoPlayerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 107, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    padding: 15,
    marginHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1E',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1E',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 25,
  },
  retryButton: {
    backgroundColor: '#4A6BFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Home Page Video Styles
  homeVideoSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  homeVideoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  homeVideoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    marginBottom: 15,
  },
  homeVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  homeVideoInfo: {
    paddingHorizontal: 5,
  },
  homeVideoMovieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  homeVideoDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    lineHeight: 20,
  },
  homeVideoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeVideoDuration: {
    color: '#888',
    fontSize: 14,
    marginLeft: 15,
  },
  homeVideoYear: {
    color: '#888',
    fontSize: 14,
    marginLeft: 15,
  },
  // Home Video Loading and Error Styles
  homeVideoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 30, 0.8)',
  },
  homeVideoLoadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  homeVideoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  homeVideoErrorText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  homeVideoErrorSubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  homeVideoFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  homeVideoFallbackTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  homeVideoFallbackText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  browseButton: {
    backgroundColor: '#4A6BFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Debug Styles
  debugContainer: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  debugText: {
    color: '#4A6BFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  debugMovieItem: {
    backgroundColor: '#0F0F1E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  debugMovieTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugMovieDetail: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  testVideoButton: {
    backgroundColor: '#4A6BFF',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  testVideoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
})