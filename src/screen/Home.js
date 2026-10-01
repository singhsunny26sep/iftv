import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  StatusBar,
  TextInput,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'
import {
  fetchAllMovies,
  fetchMovieCategories,
  formatMovieForUI
} from '../api/movies'
import { usePlayer } from '../contexts/PlayerContext'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')
const isTV = Platform.OS === 'android'
const isTablet = width >= 768
const isSmallPhone = width < 375

// Responsive sizing functions
const responsiveWidth = (percentage) => (width * percentage) / 100
const responsiveHeight = (percentage) => (height * percentage) / 100
const getFontSize = (size) => {
  if (isTablet) return size * 1.2
  if (isSmallPhone) return size * 0.85
  return size
}

// --- Premium OTT Style Category Chip ---
const CategoryChip = ({ category, isSelected, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.categoryChip,
          isSelected && styles.categoryChipActive,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        focusable={isTV}
      >
        <Text style={[
          styles.categoryText,
          isSelected && styles.categoryTextActive,
        ]}>
          {category}
        </Text>
        {isSelected && <View style={styles.categoryActiveIndicator} />}
      </TouchableOpacity>
    </Animated.View>
  )
}

// --- OTT Style Movie Card ---
const MovieCard = ({ item, onPlay, size = 'medium' }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const overlayAnim = useRef(new Animated.Value(0)).current

  const cardWidth = size === 'large'
    ? isTablet ? responsiveWidth(55) : responsiveWidth(78)
    : isTablet ? responsiveWidth(24) : responsiveWidth(34)
  const cardHeight = size === 'large'
    ? isTablet ? 300 : 240
    : isTablet ? 190 : 150

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start()
    Animated.timing(overlayAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start()
    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.movieCard, { width: cardWidth }]}
        onPress={() => onPlay(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        focusable={isTV}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={[styles.movieImage, { height: cardHeight }]}
        />

        {/* Always visible bottom gradient */}
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(0,0,0,0.85)']}
          style={styles.movieBottomGradient}
        />

        {/* Rating badge */}
        <View style={styles.movieBadge}>
          <Icon name="star" size={10} color="#FFD700" />
          <Text style={styles.movieRating}>{item.rating || 'N/A'}</Text>
        </View>

        {/* Hover overlay with play button */}
        <Animated.View style={[styles.movieOverlay, { opacity: overlayAnim }]}>
          <LinearGradient
            colors={['rgba(108,99,255,0.25)', 'rgba(0,0,0,0.55)']}
            style={styles.movieGradient}
          />
          <View style={styles.moviePlayButton}>
            <LinearGradient
              colors={['#6C63FF', '#4A3FF5']}
              style={styles.playButtonMini}
            >
              <Icon name="play" size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Title - Always visible */}
        <View style={styles.movieTitleContainer}>
          <Text style={styles.movieSmallTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {size === 'large' && (
            <Text style={styles.movieSubtitle} numberOfLines={1}>
              {item.year} • {item.duration || 'HD'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// --- OTT Style Hero Section ---
const HeroSection = ({ movie, onPlay }) => {
  if (!movie) return null

  return (
    <View style={styles.heroContainer}>
      <Image source={{ uri: movie.thumbnail }} style={styles.heroImage} />
      <LinearGradient
        colors={['transparent', 'rgba(10,14,39,0.95)', 'rgba(10,14,39,1)']}
        style={styles.heroGradient}
      />
      <View style={styles.heroContent}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>🔥 Trending Now</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.heroDescription} numberOfLines={2}>
          {movie.description}
        </Text>
        <View style={styles.heroMeta}>
          <View style={styles.heroRating}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.heroRatingText}>{movie.rating}</Text>
          </View>
          <Text style={styles.heroMetaText}>{movie.year}</Text>
          <Text style={styles.heroMetaText}>{movie.duration}</Text>
          <View style={styles.heroHD}>
            <Text style={styles.heroHDText}>HD</Text>
          </View>
        </View>
        <View style={styles.heroButtons}>
          <TouchableOpacity
            style={styles.heroPlayButton}
              onPress={() => onPlay(movie)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6C63FF', '#4A3FF5']}
                style={styles.heroPlayGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
            <Icon name="play" size={20} color="#FFFFFF" />
            <Text style={styles.heroPlayText}>Watch Now</Text>
          </LinearGradient>
        </TouchableOpacity>
          <TouchableOpacity style={styles.heroInfoButton} activeOpacity={0.8}>
            <Icon name="information-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.heroInfoText}>Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function Home() {
  const navigation = useNavigation()
  const { playMovie } = usePlayer()
  const [searchText, setSearchText] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // API Data States
  const [allMovies, setAllMovies] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryIds, setCategoryIds] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [noDataFound, setNoDataFound] = useState(false)

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const headerOpacity = useRef(new Animated.Value(0)).current
  const scrollY = useRef(new Animated.Value(0)).current

  // ============================================================
  // ✅ UNIQUE DATA DISTRIBUTION - No Repetition
  // ============================================================
  const sections = useMemo(() => {
    const movies = allMovies || []

    // Fisher-Yates shuffle for variety
    const shuffle = (arr) => {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }

    const heroMovie = movies[0] || null

    // Remove hero from pool so it doesn't repeat
    const pool = movies.slice(1)

    // Split pool into unique non-overlapping chunks
    const continueWatching = pool.slice(0, 5)
    const trending = pool.slice(5, 11)
    const allMoviesList = pool.slice(11, 20)
    const remaining = pool.slice(20)
    const popular = remaining.length >= 4 ? shuffle(remaining).slice(0, 8) : shuffle(pool).slice(0, 6)

    return {
      heroMovie,
      continueWatching,
      trending,
      allMoviesList: allMoviesList.length > 0 ? allMoviesList : pool.slice(0, 6),
      popular,
    }
  }, [allMovies])

  useEffect(() => {
    loadData()

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start()
  }, [fadeAnim, headerOpacity])

  useEffect(() => {
    if (Object.keys(categoryIds).length > 0) {
      filterMoviesByCategory(selectedCategory)
    }
  }, [selectedCategory, categoryIds, filterMoviesByCategory])

  const filterMoviesByCategory = useCallback(async (category) => {
    try {
      setIsLoading(true)
      setNoDataFound(false)
      const categoryId = category === 'All' ? null : categoryIds[category]
      const moviesData = await fetchAllMovies(1, 20, null, null, categoryId)
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
        fetchAllMovies(1, 20),
        fetchMovieCategories(),
      ])

      if (moviesRes.status === 'fulfilled') {
        const formatted = moviesRes.value.movies.map(formatMovieForUI)
        setAllMovies(formatted)
      } else {
        setError('Failed to fetch movies.')
      }

      if (categoriesRes.status === 'fulfilled') {
        const map = {}
        const names = categoriesRes.value.map((cat) => {
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [])

  // Playback lives in PlayerContext so the Play tab renders the same session.
  const handlePlayMovie = (movie) => {
    if (!movie) {
      Alert.alert('Error', 'No movie selected.')
      return
    }
    const videoUrl = movie.videoUrl || movie.url || movie.video
    if (!videoUrl || videoUrl.trim() === '') {
      Alert.alert('Error', 'No video URL available for this title.')
      return
    }
    const started = playMovie(movie)
    if (!started) {
      Alert.alert('Error', 'Could not start playback for this title.')
      return
    }
    navigation.navigate('Playing')
  }

  // --- Loading state ---
  if (isLoading && allMovies.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <View style={styles.mainLoadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.mainLoadingText}>Loading movies...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // --- Error state ---
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadData}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6C63FF', '#4A3FF5']}
              style={styles.retryGradient}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const { heroMovie, continueWatching, trending, allMoviesList, popular } = sections

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Floating Header */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#6C63FF', '#4A3FF5']}
            style={styles.logoGradient}
          >
           <Image source={require('../assets/Images/logo.png')} style={styles.logos} />
          </LinearGradient>
          <Text style={styles.logo}>IFTV</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
            <Icon name="search" size={isSmallPhone ? 20 : 22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
            <Icon
              name="notifications-outline"
              size={isSmallPhone ? 20 : 22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.7}>
            <Image
              source={{
                uri: 'https://placehold.co/100x100/6C63FF/FFFFFF?text=U',
              }}
              style={[
                styles.profileImage,
                {
                  width: isSmallPhone ? 32 : 36,
                  height: isSmallPhone ? 32 : 36,
                  borderRadius: isSmallPhone ? 16 : 18,
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C63FF"
            colors={['#6C63FF']}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ===== Hero Section ===== */}
        {heroMovie && heroMovie.videoUrl ? (
          <HeroSection movie={heroMovie} onPlay={handlePlayMovie} />
        ) : (
          <View style={styles.heroFallback}>
            <LinearGradient
              colors={['#1a1f4e', '#0a0e27']}
              style={styles.heroFallbackGradient}
            >
              <Icon name="play-circle-outline" size={64} color="#6C63FF" />
              <Text style={styles.heroFallbackTitle}>Welcome to IFTV</Text>
              <Text style={styles.heroFallbackText}>
                Discover amazing movies and shows
              </Text>
              <TouchableOpacity
                style={styles.heroFallbackButton}
                onPress={() => navigation.navigate('MovieList')}
              >
                <LinearGradient
                  colors={['#6C63FF', '#4A3FF5']}
                  style={styles.heroFallbackGradientButton}
                >
                  <Text style={styles.heroFallbackButtonText}>Browse Movies</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* ===== Live TV banner ===== */}
        <TouchableOpacity
          style={styles.liveBanner}
          onPress={() => navigation.navigate('LiveStreaming')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#E03131', '#7A1F2B']}
            style={styles.liveBannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'transparent']}
              style={styles.liveBannerSheen}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            <View style={styles.liveBannerLeft}>
              <View style={styles.liveBannerBadge}>
                <View style={styles.liveBannerDot} />
                <Text style={styles.liveBannerBadgeText}>LIVE</Text>
              </View>
              <Text style={styles.liveBannerTitle}>Live TV</Text>
              <Text style={styles.liveBannerSubtitle}>
                Channels broadcasting right now
              </Text>
            </View>

            <View style={styles.liveBannerIcon}>
              <Icon name="tv" size={isTablet ? 30 : 26} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ===== Categories ===== */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {categories.map((category) => (
              <CategoryChip
                key={category}
                category={category}
                isSelected={selectedCategory === category}
                onPress={() => handleCategorySelect(category)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ===== Continue Watching (unique data) ===== */}
        {continueWatching.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Continue Watching</Text>
              </View>
            </View>
            <FlatList
              data={continueWatching}
              renderItem={({ item }) => (
                <MovieCard item={item} onPlay={handlePlayMovie} size="large" />
              )}
              keyExtractor={(item) => `cw-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
              nestedScrollEnabled={true}
            />
          </View>
        )}

        {/* ===== Trending Now (unique data) ===== */}
        {trending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={trending}
              renderItem={({ item }) => (
                <MovieCard item={item} onPlay={handlePlayMovie} size="medium" />
              )}
              keyExtractor={(item) => `tr-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
              nestedScrollEnabled={true}
            />
          </View>
        )}

        {/* ===== All / Selected Category (unique data) ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'All' ? '🎬 All Movies' : selectedCategory}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>
          {noDataFound ? (
            <View style={styles.noDataContainer}>
              <Icon name="film-outline" size={48} color="#6B7280" />
              <Text style={styles.noDataText}>No movies found</Text>
              <Text style={styles.noDataSubtext}>
                Try selecting a different category
              </Text>
            </View>
          ) : (
            <FlatList
              data={allMoviesList}
              renderItem={({ item }) => (
                <MovieCard item={item} onPlay={handlePlayMovie} size="small" />
              )}
              keyExtractor={(item) => `all-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
              nestedScrollEnabled={true}
            />
          )}
        </View>

        {/* ===== Popular (shuffled unique data) ===== */}
        {popular.length > 0 && (
          <View style={[styles.section, { marginBottom: 40 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>⭐ Popular</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={popular}
              renderItem={({ item }) => (
                <MovieCard item={item} onPlay={handlePlayMovie} size="small" />
              )}
              keyExtractor={(item) => `pop-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
              nestedScrollEnabled={true}
            />
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  )
}

// ---- OTT Style Premium Styles ----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  // Floating Header
  floatingHeader: {
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingTop: isSmallPhone ? 10 : 15,
    paddingBottom: 10,
    backgroundColor: 'rgba(10,14,39,0.6)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoGradient: {
    width: isSmallPhone ? 36 : 40,
    height: isSmallPhone ? 36 : 40,
    borderRadius: isSmallPhone ? 10 : 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logo: {
    fontSize: isSmallPhone ? getFontSize(18) : getFontSize(22),
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: isSmallPhone ? 6 : 8,
    marginLeft: isSmallPhone ? 4 : 8,
  },
  profileButton: {
    marginLeft: isSmallPhone ? 4 : 8,
  },
  profileImage: {
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  scrollView: {
    flex: 1,
  },
  // Hero Section
  heroContainer: {
    width: '100%',
    height: isTablet ? 500 : 420,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: isSmallPhone ? 16 : 24,
    paddingBottom: isSmallPhone ? 20 : 30,
  },
  heroBadge: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? 10 : 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: isSmallPhone ? getFontSize(24) : getFontSize(32),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: isSmallPhone ? getFontSize(13) : getFontSize(16),
    color: '#D1D5DB',
    marginBottom: 12,
    lineHeight: 22,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  heroRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroRatingText: {
    color: '#FFD700',
    fontSize: isSmallPhone ? 12 : 14,
    fontWeight: '600',
  },
  heroMetaText: {
    color: '#9CA3AF',
    fontSize: isSmallPhone ? 11 : 13,
  },
  heroHD: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  heroHDText: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? 9 : 11,
    fontWeight: '700',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  heroPlayButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  heroPlayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallPhone ? 20 : 28,
    paddingVertical: isSmallPhone ? 10 : 14,
    gap: 8,
  },
  heroPlayText: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? 14 : 16,
    fontWeight: '600',
  },
  heroInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingVertical: isSmallPhone ? 10 : 14,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroInfoText: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? 14 : 16,
    fontWeight: '500',
  },
  // Hero Fallback
  heroFallback: {
    width: '100%',
    height: isTablet ? 400 : 340,
  },
  heroFallbackGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heroFallbackTitle: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? getFontSize(24) : getFontSize(32),
    fontWeight: 'bold',
    marginTop: 16,
  },
  heroFallbackText: {
    color: '#9CA3AF',
    fontSize: isSmallPhone ? getFontSize(14) : getFontSize(16),
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  heroFallbackButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  heroFallbackGradientButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  heroFallbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Categories
  // Live TV banner
  liveBanner: {
    marginHorizontal: isSmallPhone ? 12 : 20,
    marginTop: isSmallPhone ? 12 : 16,
    marginBottom: isSmallPhone ? 4 : 6,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#E03131',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  liveBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingVertical: isSmallPhone ? 14 : 17,
  },
  liveBannerSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  liveBannerLeft: { flex: 1 },
  liveBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    marginBottom: 7,
  },
  liveBannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveBannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  liveBannerTitle: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? getFontSize(17) : getFontSize(19),
    fontWeight: 'bold',
  },
  liveBannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: isSmallPhone ? 11.5 : 12.5,
    marginTop: 3,
  },
  liveBannerIcon: {
    width: isSmallPhone ? 46 : 52,
    height: isSmallPhone ? 46 : 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },

  categoriesWrapper: {
    paddingHorizontal: isSmallPhone ? 12 : 20,
    paddingVertical: isSmallPhone ? 12 : 16,
  },
  categoryChip: {
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingVertical: isSmallPhone ? 6 : 10,
    borderRadius: 20,
    marginRight: isSmallPhone ? 8 : 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderColor: '#6C63FF',
  },
  categoryText: {
    color: '#9CA3AF',
    fontSize: isSmallPhone ? getFontSize(13) : getFontSize(15),
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryActiveIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '30%',
    right: '30%',
    height: 2,
    backgroundColor: '#6C63FF',
    borderRadius: 2,
  },
  // Sections
  section: {
    marginBottom: isSmallPhone ? 20 : 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallPhone ? 12 : 20,
    marginBottom: isSmallPhone ? 10 : 15,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 4,
    height: isSmallPhone ? 18 : 22,
    backgroundColor: '#6C63FF',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: isSmallPhone ? getFontSize(18) : getFontSize(22),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllText: {
    color: '#6C63FF',
    fontSize: isSmallPhone ? getFontSize(13) : getFontSize(15),
    fontWeight: '600',
  },
  cardList: {
    paddingHorizontal: isSmallPhone ? 12 : 20,
    gap: isSmallPhone ? 8 : 12,
  },
  // Movie Card
  movieCard: {
    marginRight: isSmallPhone ? 8 : 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  movieImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  movieBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  movieOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  movieGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  movieBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  movieRating: {
    color: '#FFD700',
    fontSize: isSmallPhone ? 10 : 12,
    fontWeight: '600',
  },
  moviePlayButton: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -22 }, { translateY: -22 }],
  },
  playButtonMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  movieTitleContainer: {
    paddingVertical: isSmallPhone ? 6 : 8,
    paddingHorizontal: 8,
  },
  movieSmallTitle: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? 11 : 13,
    fontWeight: '600',
  },
  movieSubtitle: {
    color: '#9CA3AF',
    fontSize: isSmallPhone ? 10 : 11,
    marginTop: 2,
  },
  // No Data
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallPhone ? 30 : 40,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: isSmallPhone ? getFontSize(16) : getFontSize(18),
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
  },
  noDataSubtext: {
    fontSize: isSmallPhone ? getFontSize(12) : getFontSize(14),
    color: '#6B7280',
    marginTop: 4,
  },
  // Loading / Error
  mainLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e27',
  },
  mainLoadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: isSmallPhone ? getFontSize(14) : getFontSize(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e27',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: isSmallPhone ? getFontSize(16) : getFontSize(18),
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  retryGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? getFontSize(14) : getFontSize(16),
    fontWeight: '600',
  },
  logos:{
    width: isSmallPhone ? 24 : 28,
    height: isSmallPhone ? 24 : 28,
  }
})