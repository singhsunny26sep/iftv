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
import React, { useState, useEffect, useCallback } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import Video from 'react-native-video'
import { useNavigation } from '@react-navigation/native'
import {
  fetchAllMovies,
  fetchMovieCategories,
  formatMovieForUI
} from '../api/movies'
import authService from '../api/auth'

const { width, height } = Dimensions.get('window')

// --- Video Player Modal (extracted to module scope to prevent remount loops) ---
const VideoPlayerModal = ({
  visible,
  source,
  paused,
  isLoading,
  videoKey,
  onClose,
  onTogglePause,
  onLoad,
  onError,
  onBuffer,
}) => {
  if (!source) return null

  return (
    <Modal
      animationType="slide"
      visible={visible}
      statusBarTranslucent={true}
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      <View style={styles.videoContainer}>
        <TouchableOpacity style={styles.videoCloseButton} onPress={onClose}>
          <Icon name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.videoPlayerContainer}>
          <Video
            key={videoKey}
            source={source}
            style={styles.videoPlayer}
            paused={paused}
            resizeMode="contain"
            controls={true}
            repeat={false}
            muted={false}
            volume={1.0}
            rate={1.0}
            onLoad={onLoad}
            onError={onError}
            onBuffer={onBuffer}
            onLoadStart={() => console.log('⏳ Video load started')}
          />

          {isLoading && (
            <View style={styles.videoLoadingContainer}>
              <ActivityIndicator size="large" color="#4A6BFF" />
              <Text style={styles.videoLoadingText}>Loading video...</Text>
            </View>
          )}

          {!isLoading && paused && (
            <TouchableOpacity
              style={styles.playButtonOverlay}
              onPress={onTogglePause}
              activeOpacity={0.8}
            >
              <View style={styles.playButtonCircle}>
                <Icon name="play" size={50} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.videoControls}>
          <TouchableOpacity style={styles.controlButton} onPress={onTogglePause}>
            <Icon name={paused ? 'play' : 'pause'} size={24} color="#FFFFFF" />
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
}

export default function Home() {
  const navigation = useNavigation()
  const [searchText, setSearchText] = useState('')
  const [showProfile, setShowProfile] = useState(false)

  // Video states
  const [videoVisible, setVideoVisible] = useState(false)
  const [videoSource, setVideoSource] = useState(null)
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')
  const [isVideoPaused, setIsVideoPaused] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoKey, setVideoKey] = useState(0) // used to force remount

  // --- Build video source with authentication ---
  const buildVideoSource = (url) => {
    if (!url) return null
    const source = { uri: url }

    // Add Authorization header only for same-origin API requests
    // (Cloudflare Stream URLs are public and don't need headers)
    try {
      const userSession = authService.getCurrentUser() || authService.userSession
      const token = userSession?.authToken
      if (token && url && url.includes('iftv-ott.onrender.com')) {
        source.headers = { Authorization: `Bearer ${token}` }
      }
    } catch (e) {
      console.warn('Auth header not added:', e)
    }

    return source
  }

  // --- Play video handler ---
  const handlePlayVideo = (videoUrl) => {
    console.log('🎬 Play requested for:', videoUrl)

    if (!videoUrl || videoUrl.trim() === '') {
      Alert.alert('Error', 'No video URL provided.')
      return
    }

    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
      Alert.alert('Error', 'Invalid video URL format.')
      return
    }

    // Build source with headers
    const source = buildVideoSource(videoUrl)
    if (!source) {
      Alert.alert('Error', 'Could not create video source.')
      return
    }

    // Set states and force Video component to remount with new key
    setCurrentVideoUrl(videoUrl)
    setVideoSource(source)
    setVideoKey(prev => prev + 1) // forces remount
    setIsVideoPaused(false)
    setIsVideoLoading(true)
    setVideoVisible(true)
  }

  // --- Close video ---
  const closeVideo = () => {
    setVideoVisible(false)
    setIsVideoPaused(true)
    setIsVideoLoading(false)
    // Release source to free memory
    setTimeout(() => {
      setVideoSource(null)
      setCurrentVideoUrl('')
    }, 300)
  }

  // --- Video controls ---
  const toggleVideoPause = () => {
    setIsVideoPaused(prev => !prev)
  }

  // --- Video event handlers ---
  const handleVideoLoad = () => {
    console.log('✅ Video loaded successfully')
    setIsVideoLoading(false)
  }

  const handleVideoError = (error) => {
    console.log('❌ Video error:', error)
    const err = error?.error || error
    const errorCode = err?.errorCode || err?.code || null
    console.log('❌ Video error code:', errorCode)
    console.log('❌ Full error object:', JSON.stringify(error, null, 2))

    let detail = `Error code: ${errorCode || 'unknown'}. Please check your internet connection.`
    if (errorCode === -1009 || errorCode === -1) detail = 'Network error. Check your connection.'
    else if (errorCode === -1004 || errorCode === 1004 || errorCode === -1006 || errorCode === 1006) detail = 'URL not reachable or invalid.'
    else if (errorCode === 1005 || errorCode === 403 || errorCode === 401) detail = 'Access denied. Your session may have expired.'
    else if (errorCode === -11800 || errorCode === -11801 || errorCode === 2001) detail = 'Video format not supported on this device.'
    else if (errorCode === -11819 || errorCode === -11850 || errorCode === 2002) detail = 'Stream parsing error.'

    setIsVideoLoading(false)

    Alert.alert(
      'Playback Error',
      `Unable to play video. ${detail}`,
      [
        { text: 'Close', onPress: closeVideo },
        { 
          text: 'Retry', 
          onPress: () => {
            closeVideo()
            // Re‑trigger play after a short delay
            setTimeout(() => handlePlayVideo(currentVideoUrl), 500)
          }
        }
      ]
    )
  }

  const handleVideoBuffer = ({ isBuffering }) => {
    console.log('⏳ Buffering:', isBuffering)
    if (isBuffering) setIsVideoLoading(true)
    else setIsVideoLoading(false)
  }

  // --- API Data States ---
  const [allMovies, setAllMovies] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryIds, setCategoryIds] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [noDataFound, setNoDataFound] = useState(false)

  // --- Load data ---
  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterMoviesByCategory(selectedCategory)
  }, [selectedCategory, filterMoviesByCategory])

  const filterMoviesByCategory = useCallback(async (category) => {
    try {
      setIsLoading(true)
      setNoDataFound(false)
      const categoryId = category === 'All' ? null : categoryIds[category]
      const moviesData = await fetchAllMovies(1, 10, null, null, categoryId)
      if (moviesData.movies?.length > 0) {
        setAllMovies(moviesData.movies.map(formatMovieForUI))
      } else {
        setAllMovies([])
        setNoDataFound(true)
      }
    } catch (err) {
      console.error('Filter error:', err)
      setAllMovies([])
      setNoDataFound(true)
    } finally {
      setIsLoading(false)
    }
  }, [categoryIds])

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [moviesRes, categoriesRes] = await Promise.allSettled([
        fetchAllMovies(1, 10),
        fetchMovieCategories()
      ])

      if (moviesRes.status === 'fulfilled') {
        const formatted = moviesRes.value.movies.map(formatMovieForUI)
        setAllMovies(formatted)
      } else {
        setError('Failed to fetch movies.')
      }

      if (categoriesRes.status === 'fulfilled') {
        const map = {}
        const names = categoriesRes.value.map(cat => {
          const name = cat.name || cat.title || 'Unknown'
          map[name] = cat._id || cat.id
          return name
        })
        setCategoryIds(map)
        setCategories(['All', ...names])
      }
    } catch (err) {
      setError('Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  // --- User profile (dummy) ---
  const userProfile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    membership: 'Premium',
    joinDate: 'January 2024',
    watchHistory: 47,
    favorites: 23,
    profileImage: 'https://placehold.co/100x100/4A6BFF/FFFFFF?text=JD'
  }

  // --- Get featured movie ---
  const getHomePageVideo = () => {
    if (allMovies.length > 0) return allMovies[0]
    return null
  }
  const homePageVideo = getHomePageVideo()

  // --- Render helpers ---
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

  // --- Profile Modal ---
  const ProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showProfile}
      onRequestClose={() => setShowProfile(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.profileContainer}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileTitle}>My Profile</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowProfile(false)}>
              <Icon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Image source={{ uri: userProfile.profileImage }} style={styles.profileLargeImage} />
            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userEmail}>{userProfile.email}</Text>
            <View style={styles.membershipBadge}>
              <Icon name="diamond" size={16} color="#FFD700" />
              <Text style={styles.membershipText}>{userProfile.membership} Member</Text>
            </View>
          </View>
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
          <TouchableOpacity style={styles.logoutButton}>
            <Icon name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  // --- Loading / Error states ---
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
        <View style={styles.mainLoadingContainer}>
          <ActivityIndicator size="large" color="#4A6BFF" />
          <Text style={styles.mainLoadingText}>Loading movies...</Text>
        </View>
      </SafeAreaView>
    )
  }

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
    )
  }

  // --- Main Render ---
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
          <TouchableOpacity style={styles.profileButton} onPress={() => setShowProfile(true)}>
            <Image source={{ uri: userProfile.profileImage }} style={styles.profileImage} />
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
          nestedScrollEnabled={true}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Home Page Video Feature */}
        {homePageVideo && homePageVideo.videoUrl ? (
          <View style={styles.homeVideoSection}>
            <Text style={styles.homeVideoTitle}>Now Playing</Text>
            <TouchableOpacity
              style={styles.homeVideoContainer}
              onPress={() => handlePlayVideo(homePageVideo.videoUrl)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: homePageVideo.thumbnail }} style={styles.homeVideoThumbnail} />
              <View style={styles.homeVideoPlayOverlay}>
                <Icon name="play-circle" size={64} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
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

        {/* Latest Movies */}
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
            nestedScrollEnabled={true}
          />
        </View>

        {/* All Movies Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'All Movies' : selectedCategory}
            </Text>
          </View>
          {noDataFound ? (
            <View style={styles.noDataContainer}>
              <Icon name="film-outline" size={64} color="#666" />
              <Text style={styles.noDataText}>No movies found</Text>
              <Text style={styles.noDataSubtext}>Try selecting a different category</Text>
            </View>
          ) : (
            <FlatList
              data={allMovies}
              renderItem={renderPopularItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularList}
              nestedScrollEnabled={true}
            />
          )}
        </View>

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

      {/* Modals */}
      <ProfileModal />
      <VideoPlayerModal
        visible={videoVisible}
        source={videoSource}
        paused={isVideoPaused}
        isLoading={isVideoLoading}
        videoKey={videoKey}
        onClose={closeVideo}
        onTogglePause={toggleVideoPause}
        onLoad={handleVideoLoad}
        onError={handleVideoError}
        onBuffer={handleVideoBuffer}
      />
    </SafeAreaView>
  )
}

// ---- Styles (unchanged, keep as provided) ----
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
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
  videoLoadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  videoLoadingText: {
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
  mainLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1E',
  },
  mainLoadingText: {
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
  homeVideoThumbnail: {
    width: '100%',
    height: '100%',
  },
  homeVideoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  // Debug styles (optional – remove if not needed)
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
})