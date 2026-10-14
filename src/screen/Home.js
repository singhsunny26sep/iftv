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
  ImageBackground,
} from 'react-native'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'
import {
  fetchAllMovies,
  fetchMovieCategories,
  formatMovieForUI,
  isMoviePlayable,
  lockCallToAction,
} from '../api/movies'
import { usePlayer } from '../contexts/PlayerContext'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')
const isTV = Platform.OS === 'android'
const isTablet = width >= 768
const isSmallPhone = width < 375

const responsiveWidth = (p) => (width * p) / 100
const responsiveHeight = (p) => (height * p) / 100
const getFontSize = (size) => {
  if (isTablet) return size * 1.2
  if (isSmallPhone) return size * 0.85
  return size
}

// ============================================================
// 🌊 Animated Background (moving gradients)
// ============================================================
const AnimatedBackground = () => {
  const moveX = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(moveX, {
          toValue: 1,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(moveX, {
          toValue: 0,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [moveX])

  const translateX = moveX.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 50],
  })
  const translateY = moveX.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30],
  })

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.bgBlob,
          styles.bgBlob1,
          { transform: [{ translateX }, { translateY }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bgBlob,
          styles.bgBlob2,
          {
            transform: [
              { translateX: Animated.multiply(translateX, -1) },
              { translateY },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgBlob,
          styles.bgBlob3,
          { transform: [{ translateX }, { translateY: Animated.multiply(translateY, -1) }] },
        ]}
      />
    </View>
  )
}

// ============================================================
// ✨ Shimmer Skeleton Loader
// ============================================================
const ShimmerCard = ({ width: w, height: h }) => {
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [shimmer])

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-w, w],
  })

  return (
    <View style={[styles.shimmerCard, { width: w, height: h }]}>
      <Animated.View
        style={[
          styles.shimmerOverlay,
          { transform: [{ translateX }] },
        ]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </View>
  )
}

// ============================================================
// 🎯 Premium Category Chip with neon glow
// ============================================================
const CategoryChip = ({ category, isSelected, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current

  useEffect(() => {
    Animated.spring(glowAnim, {
      toValue: isSelected ? 1 : 0,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start()
  }, [isSelected, glowAnim])

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
      {/* Neon glow behind */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.chipGlow,
          {
            opacity: glowAnim,
            backgroundColor: '#6C63FF',
          },
        ]}
      />
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        focusable={isTV}>
        {isSelected && (
          <LinearGradient
            colors={['#6C63FF', '#4A3FF5']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <Text
          style={[
            styles.categoryText,
            isSelected && styles.categoryTextActive,
          ]}>
          {category}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ============================================================
// 🎬 Premium Movie Card with progress + tilt + shimmer
// ============================================================
const MovieCard = ({ item, onPlay, size = 'medium', showProgress = false }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const overlayAnim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const shineAnim = useRef(new Animated.Value(0)).current

  const cardWidth =
    size === 'large'
      ? isTablet
        ? responsiveWidth(55)
        : responsiveWidth(78)
      : isTablet
      ? responsiveWidth(24)
      : responsiveWidth(34)
  const cardHeight =
    size === 'large'
      ? isTablet
        ? 300
        : 240
      : isTablet
      ? 190
      : 150

  // Random progress for demo (replace with real progress from API)
  const progress = useMemo(() => Math.floor(Math.random() * 60) + 20, [])

  useEffect(() => {
    if (overlayAnim._value === 1) {
      const loop = Animated.loop(
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      )
      loop.start()
      return () => loop.stop()
    }
  }, [overlayAnim, shineAnim])

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 0,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start()
    shineAnim.setValue(0)
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-2deg'],
  })

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-cardWidth, cardWidth],
  })

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }, { rotate }],
      }}>
      <TouchableOpacity
        style={[styles.movieCard, { width: cardWidth }]}
        onPress={() => onPlay(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        focusable={isTV}>
        <ImageBackground
          source={{ uri: item.thumbnail }}
          style={[styles.movieImage, { height: cardHeight }]}
          imageStyle={{ borderRadius: 0 }}>
          {/* Animated shine on press */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.movieShine,
              { transform: [{ translateX: shineTranslate }] },
            ]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>

          {/* Bottom gradient */}
          <LinearGradient
            colors={['transparent', 'transparent', 'rgba(0,0,0,0.9)']}
            style={styles.movieBottomGradient}
          />
        </ImageBackground>

        {/* Rating badge with glow */}
        <View style={styles.movieBadge}>
          <Icon name="star" size={10} color="#FFD700" />
          <Text style={styles.movieRating}>{item.rating || 'N/A'}</Text>
        </View>

        {/* Premium lock badge */}
        {item.isLocked && (
          <LinearGradient
            colors={['#FFD700', '#E09B00']}
            style={styles.movieLockBadge}>
            <Icon name="lock-closed" size={10} color="#0F0F1E" />
            <Text style={styles.movieLockText}>Premium</Text>
          </LinearGradient>
        )}

        {/* HD badge */}
        <View style={styles.movieHDBadge}>
          <Text style={styles.movieHDText}>HD</Text>
        </View>

        {/* Overlay with play button */}
        <Animated.View style={[styles.movieOverlay, { opacity: overlayAnim }]}>
          <LinearGradient
            colors={['rgba(108,99,255,0.25)', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.moviePlayButton}>
            <LinearGradient
              colors={['#6C63FF', '#4A3FF5']}
              style={styles.playButtonMini}>
              <Icon name="play" size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Title */}
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

        {/* Progress bar for continue watching */}
        {showProgress && (
          <View style={styles.progressBarWrap}>
            <LinearGradient
              colors={['#6C63FF', '#4A3FF5']}
              style={[styles.progressBar, { width: `${progress}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

// ============================================================
// 🌟 Hero Section with parallax feel + fade-in
// ============================================================
const HeroSection = ({ movie, onPlay }) => {
  const fadeIn = useRef(new Animated.Value(0)).current
  const slideUp = useRef(new Animated.Value(30)).current
  const badgeGlow = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!movie) return
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeGlow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(badgeGlow, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [movie, fadeIn, slideUp, badgeGlow])

  if (!movie) return null

  const glowOpacity = badgeGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  })

  return (
    <View style={styles.heroContainer}>
      <Image source={{ uri: movie.thumbnail }} style={styles.heroImage} />

      {/* Multi-layer gradient overlay */}
      <LinearGradient
        colors={[
          'rgba(10,14,39,0.3)',
          'transparent',
          'rgba(10,14,39,0.95)',
          'rgba(10,14,39,1)',
        ]}
        locations={[0, 0.3, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated content */}
      <Animated.View
        style={[
          styles.heroContent,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}>
        <Animated.View
          style={[styles.heroBadge, { opacity: glowOpacity }]}>
          <LinearGradient
            colors={['#FF6B6B', '#E03131']}
            style={styles.heroBadgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <Icon name="flame" size={12} color="#FFF" />
            <Text style={styles.heroBadgeText}>Trending Now</Text>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.heroTitle} numberOfLines={2}>
          {movie.title}
        </Text>

        <Text style={styles.heroDescription} numberOfLines={2}>
          {movie.description}
        </Text>

        <View style={styles.heroMeta}>
          <View style={styles.heroRating}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.heroRatingText}>{movie.rating}</Text>
          </View>
          <View style={styles.heroDot} />
          <Text style={styles.heroMetaText}>{movie.year}</Text>
          <View style={styles.heroDot} />
          <Text style={styles.heroMetaText}>{movie.duration || 'HD'}</Text>
          <View style={styles.heroHD}>
            <Text style={styles.heroHDText}>4K</Text>
          </View>
        </View>

        <View style={styles.heroButtons}>
          <TouchableOpacity
            style={styles.heroPlayButton}
            onPress={() => onPlay(movie)}
            activeOpacity={0.85}>
            <LinearGradient
              colors={['#6C63FF', '#4A3FF5']}
              style={styles.heroPlayGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Icon name="play" size={20} color="#FFFFFF" />
              <Text style={styles.heroPlayText}>Watch Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroInfoButton}
            activeOpacity={0.85}>
            <Icon name="add" size={22} color="#FFFFFF" />
            <Text style={styles.heroInfoText}>My List</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

// ============================================================
// 📺 Live TV Banner with pulsing dot
// ============================================================
const LiveBanner = ({ onPress }) => {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const dotScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  })
  const dotOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  })

  return (
    <TouchableOpacity
      style={styles.liveBanner}
      onPress={onPress}
      activeOpacity={0.85}>
      <LinearGradient
        colors={['#E03131', '#7A1F2B']}
        style={styles.liveBannerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'transparent']}
          style={styles.liveBannerSheen}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.liveBannerLeft}>
          <View style={styles.liveBannerBadge}>
            <Animated.View
              style={[
                styles.liveBannerDot,
                { transform: [{ scale: dotScale }], opacity: dotOpacity },
              ]}
            />
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
  )
}

// ============================================================
// 🎯 Section Header Component (with animated accent)
// ============================================================
const SectionHeader = ({ title, onSeeAll }) => {
  const accentAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(accentAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(accentAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [accentAnim])

  const accentOpacity = accentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  })

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Animated.View
          style={[styles.sectionAccent, { opacity: accentOpacity }]}
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll}>
          <View style={styles.seeAllWrap}>
            <Text style={styles.seeAllText}>See All</Text>
            <Icon name="arrow-forward" size={14} color="#6C63FF" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ============================================================
// MAIN HOME COMPONENT
// ============================================================
export default function Home() {
  const navigation = useNavigation()
  const { playMovie } = usePlayer()
  const [searchText, setSearchText] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const [allMovies, setAllMovies] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryIds, setCategoryIds] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [noDataFound, setNoDataFound] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const headerOpacity = useRef(new Animated.Value(0)).current

  const cardW = isTablet ? responsiveWidth(24) : responsiveWidth(34)

  const sections = useMemo(() => {
    const movies = allMovies || []

    const shuffle = (arr) => {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }

    const heroMovie = movies[0] || null
    const pool = movies.slice(1)

    const continueWatching = pool.slice(0, 5)
    const trending = pool.slice(5, 11)
    const allMoviesList = pool.slice(11, 20)
    const remaining = pool.slice(20)
    const popular =
      remaining.length >= 4
        ? shuffle(remaining).slice(0, 8)
        : shuffle(pool).slice(0, 6)

    return {
      heroMovie,
      continueWatching,
      trending,
      allMoviesList:
        allMoviesList.length > 0 ? allMoviesList : pool.slice(0, 6),
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

  const filterMoviesByCategory = useCallback(
    async (category) => {
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
    },
    [categoryIds],
  )

  const didSeedInitialList = useRef(false)
  useEffect(() => {
    if (Object.keys(categoryIds).length === 0) return
    if (!didSeedInitialList.current) {
      didSeedInitialList.current = true
      return
    }
    filterMoviesByCategory(selectedCategory)
  }, [selectedCategory, categoryIds, filterMoviesByCategory])

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

  const handlePlayMovie = (movie) => {
    if (!movie) {
      Alert.alert('Error', 'No movie selected.')
      return
    }

    if (!isMoviePlayable(movie)) {
      const cta = lockCallToAction(movie)
      if (movie.isLocked) {
        switch (cta?.action) {
          case 'subscribe':
            navigation.navigate('Subscription')
            return
          case 'login':
            Alert.alert('Login karke dekho', 'Sign in to unlock this title.')
            return
          default:
            Alert.alert('Locked', 'This title requires a subscription.')
            return
        }
      }
      Alert.alert('Error', 'No video URL available for this title.')
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

  // --- Loading (with shimmer) ---
  if (isLoading && allMovies.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <AnimatedBackground />
        <View style={{ padding: 20, paddingTop: 60 }}>
          <ShimmerCard width={width - 40} height={240} />
          <View style={{ height: 20 }} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ShimmerCard width={100} height={40} />
            <ShimmerCard width={100} height={40} />
            <ShimmerCard width={100} height={40} />
          </View>
          <View style={{ height: 30 }} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ShimmerCard width={cardW} height={150} />
            <ShimmerCard width={cardW} height={150} />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // --- Error ---
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <AnimatedBackground />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadData}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#6C63FF', '#4A3FF5']}
              style={styles.retryGradient}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const { heroMovie, continueWatching, trending, allMoviesList, popular } =
    sections

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <AnimatedBackground />

      {/* Floating Glass Header */}
      <Animated.View
        style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#6C63FF', '#4A3FF5']}
            style={styles.logoGradient}>
            <Image
              source={require('../assets/Images/logo.png')}
              style={styles.logos}
            />
          </LinearGradient>
          <Text style={styles.logo}>IFTV</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
            <Icon name="search" size={isSmallPhone ? 20 : 22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}>
            <View>
              <Icon
                name="notifications-outline"
                size={isSmallPhone ? 20 : 22}
                color="#FFFFFF"
              />
              <View style={styles.notifDot} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.7}>
            <LinearGradient
              colors={['#6C63FF', '#4A3FF5']}
              style={styles.profileRing}>
              <Image
                source={{
                  uri: 'https://placehold.co/100x100/6C63FF/FFFFFF?text=U',
                }}
                style={styles.profileImage}
              />
            </LinearGradient>
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
        }>
        {/* Hero */}
        {heroMovie && heroMovie.videoUrl ? (
          <HeroSection movie={heroMovie} onPlay={handlePlayMovie} />
        ) : (
          <View style={styles.heroFallback}>
            <LinearGradient
              colors={['#1a1f4e', '#0a0e27']}
              style={styles.heroFallbackGradient}>
              <Icon name="play-circle-outline" size={64} color="#6C63FF" />
              <Text style={styles.heroFallbackTitle}>Welcome to IFTV</Text>
              <Text style={styles.heroFallbackText}>
                Discover amazing movies and shows
              </Text>
              <TouchableOpacity
                style={styles.heroFallbackButton}
                onPress={() => navigation.navigate('MovieList')}>
                <LinearGradient
                  colors={['#6C63FF', '#4A3FF5']}
                  style={styles.heroFallbackGradientButton}>
                  <Text style={styles.heroFallbackButtonText}>
                    Browse Movies
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Live TV */}
        <LiveBanner onPress={() => navigation.navigate('LiveStreaming')} />

        {/* Categories */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}>
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

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Continue Watching" />
            <FlatList
              data={continueWatching}
              renderItem={({ item }) => (
                <MovieCard
                  item={item}
                  onPlay={handlePlayMovie}
                  size="large"
                  showProgress
                />
              )}
              keyExtractor={(item) => `cw-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
              nestedScrollEnabled={true}
            />
          </View>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="🔥 Trending Now"
              onSeeAll={() => navigation.navigate('MovieList')}
            />
            <FlatList
              data={trending}
              renderItem={({ item }) => (
                <MovieCard
                  item={item}
                  onPlay={handlePlayMovie}
                  size="medium"
                />
              )}
              keyExtractor={(item) => `tr-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
              nestedScrollEnabled={true}
            />
          </View>
        )}

        {/* All / Selected Category */}
        <View style={styles.section}>
          <SectionHeader
            title={
              selectedCategory === 'All'
                ? '🎬 All Movies'
                : selectedCategory
            }
            onSeeAll={() => navigation.navigate('MovieList')}
          />
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
                <MovieCard
                  item={item}
                  onPlay={handlePlayMovie}
                  size="small"
                />
              )}
              keyExtractor={(item) => `all-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardList}
              nestedScrollEnabled={true}
            />
          )}
        </View>

        {/* Popular */}
        {popular.length > 0 && (
          <View style={[styles.section, { marginBottom: 40 }]}>
            <SectionHeader
              title="⭐ Popular"
              onSeeAll={() => navigation.navigate('MovieList')}
            />
            <FlatList
              data={popular}
              renderItem={({ item }) => (
                <MovieCard
                  item={item}
                  onPlay={handlePlayMovie}
                  size="small"
                />
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

      {/* Floating Action Search Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Search')}>
        <LinearGradient
          colors={['#6C63FF', '#4A3FF5']}
          style={styles.fabGradient}>
          <Icon name="search" size={22} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },

  // Animated bg blobs
  bgBlob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  bgBlob1: {
    width: 300,
    height: 300,
    backgroundColor: '#6C63FF',
    top: -80,
    left: -80,
  },
  bgBlob2: {
    width: 250,
    height: 250,
    backgroundColor: '#E03131',
    top: 400,
    right: -100,
  },
  bgBlob3: {
    width: 280,
    height: 280,
    backgroundColor: '#3DD9C4',
    bottom: 100,
    left: -120,
  },

  // Shimmer
  shimmerCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },

  // Floating header
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
    backgroundColor: 'rgba(10,14,39,0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108,99,255,0.15)',
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
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  logos: {
    width: isSmallPhone ? 24 : 28,
    height: isSmallPhone ? 24 : 28,
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
  notifDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5E7E',
    borderWidth: 1.5,
    borderColor: '#0a0e27',
  },
  profileButton: {
    marginLeft: isSmallPhone ? 4 : 8,
  },
  profileRing: {
    padding: 2,
    borderRadius: 20,
  },
  profileImage: {
    width: isSmallPhone ? 32 : 36,
    height: isSmallPhone ? 32 : 36,
    borderRadius: isSmallPhone ? 16 : 18,
    borderWidth: 2,
    borderColor: '#0a0e27',
  },
  scrollView: {
    flex: 1,
  },

  // Hero
  heroContainer: {
    width: '100%',
    height: isTablet ? 500 : 440,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? 10 : 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: isSmallPhone ? getFontSize(24) : getFontSize(32),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroDescription: {
    fontSize: isSmallPhone ? getFontSize(13) : getFontSize(15),
    color: '#D1D5DB',
    marginBottom: 12,
    lineHeight: 20,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontWeight: '700',
  },
  heroDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#6B7280',
  },
  heroMetaText: {
    color: '#9CA3AF',
    fontSize: isSmallPhone ? 11 : 13,
  },
  heroHD: {
    backgroundColor: 'rgba(108,99,255,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.5)',
  },
  heroHDText: {
    color: '#A79BFF',
    fontSize: isSmallPhone ? 9 : 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  heroPlayButton: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  heroPlayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallPhone ? 20 : 28,
    paddingVertical: isSmallPhone ? 12 : 14,
    gap: 8,
  },
  heroPlayText: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? 14 : 16,
    fontWeight: '700',
  },
  heroInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingVertical: isSmallPhone ? 12 : 14,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroInfoText: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? 14 : 16,
    fontWeight: '600',
  },

  // Hero fallback
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

  // Live banner
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
    backgroundColor: 'rgba(0,0,0,0.3)',
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

  // Categories
  categoriesWrapper: {
    paddingHorizontal: isSmallPhone ? 12 : 20,
    paddingVertical: isSmallPhone ? 12 : 16,
  },
  chipGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  categoryChip: {
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingVertical: isSmallPhone ? 8 : 10,
    borderRadius: 20,
    marginRight: isSmallPhone ? 8 : 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  categoryChipActive: {
    borderColor: 'transparent',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryText: {
    color: '#9CA3AF',
    fontSize: isSmallPhone ? getFontSize(13) : getFontSize(14),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Sections
  section: {
    marginBottom: isSmallPhone ? 22 : 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallPhone ? 12 : 20,
    marginBottom: isSmallPhone ? 12 : 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: isSmallPhone ? 18 : 22,
    backgroundColor: '#6C63FF',
    borderRadius: 2,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: isSmallPhone ? getFontSize(17) : getFontSize(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  seeAllWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: '#6C63FF',
    fontSize: isSmallPhone ? getFontSize(12) : getFontSize(13),
    fontWeight: '700',
  },
  cardList: {
    paddingHorizontal: isSmallPhone ? 12 : 20,
    gap: isSmallPhone ? 8 : 12,
  },

  // Movie card
  movieCard: {
    marginRight: isSmallPhone ? 8 : 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  movieImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  movieShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
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
  movieBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  movieRating: {
    color: '#FFD700',
    fontSize: isSmallPhone ? 10 : 11,
    fontWeight: '700',
  },
  movieLockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  movieLockText: {
    color: '#0F0F1E',
    fontSize: isSmallPhone ? 9 : 10,
    fontWeight: '800',
  },
  movieHDBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(108,99,255,0.9)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  movieHDText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
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
  progressBarWrap: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },

  // No data
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

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
    borderRadius: 10,
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  fabGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
})