import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  PanResponder,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { usePlayer, buildVideoSource } from '../contexts/PlayerContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const getFontSize = (size) => {
  if (isTablet) return size * 1.2;
  if (isSmallPhone) return size * 0.85;
  return size;
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = n => String(n).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
};

const NowPlayingScreen = ({ navigation }) => {
  const {
    currentMovie,
    isPlaying,
    playerKey,
    playMovie,
    togglePlayback,
    reload,
    stop,
  } = usePlayer();

  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef(null);
  const controlsTimer = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.1)),
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Reset per-movie playback state whenever the source changes.
  useEffect(() => {
    setIsLoading(true);
    setDuration(0);
    setPosition(0);
  }, [playerKey, currentMovie?.videoUrl]);

  // Auto-hide the overlay controls while playing.
  useEffect(() => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
      controlsTimer.current = null;
    }
    if (isPlaying && showControls) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
    }
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [isPlaying, showControls, playerKey]);

  const seekToRatio = useCallback(
    (ratio) => {
      if (!duration || !videoRef.current) return;
      videoRef.current.seek(ratio * duration);
      setPosition(ratio * duration);
    },
    [duration]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (!trackWidth) return;
        seekToRatio(Math.max(0, Math.min(1, evt.nativeEvent.locationX / trackWidth)));
      },
      onPanResponderMove: (evt, gesture) => {
        if (!trackWidth) return;
        const x = evt.nativeEvent.locationX ?? gesture.moveX;
        seekToRatio(Math.max(0, Math.min(1, x / trackWidth)));
      },
    })
  ).current;

  const handleError = (error) => {
    console.log('Video error:', error);
    setIsLoading(false);
    setIsBuffering(false);
    Alert.alert(
      'Playback Error',
      'Unable to play this video. Please try again.',
      [
        { text: 'Close', onPress: stop },
        { text: 'Retry', onPress: reload },
      ]
    );
  };

  const handleGoBack = () => {
    stop();
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // --- Empty state: nothing has been played yet ---
  if (!currentMovie) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <LinearGradient
          colors={['#0a0e27', '#1a1f4e']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>Now Playing</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <LinearGradient
                colors={['#6C63FF', '#4A3FF5']}
                style={styles.emptyIcon}
              >
                <Icon name="play-circle" size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>Nothing Playing</Text>
            <Text style={styles.emptySubtext}>
              Pick a movie from Home and it will start playing here.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6C63FF', '#4A3FF5']}
                style={styles.browseGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.browseButtonText}>Browse Movies</Text>
                <Icon name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const source = buildVideoSource(currentMovie.videoUrl);
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#0a0e27', '#1a1f4e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Icon name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentMovie.title || 'Now Playing'}
            </Text>
            {currentMovie.year ? (
              <Text style={styles.headerSubtitle}>{currentMovie.year}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowControls(v => !v)}
            activeOpacity={0.7}
          >
            <Icon name="ellipsis-horizontal" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* Video stage */}
        <TouchableOpacity
          style={styles.stage}
          activeOpacity={1}
          onPress={() => setShowControls(v => !v)}
        >
          <Video
            ref={videoRef}
            key={playerKey}
            source={source}
            style={styles.video}
            paused={!isPlaying}
            resizeMode="contain"
            controls={false}
            repeat={false}
            volume={1.0}
            rate={1.0}
            onLoad={(data) => {
              setDuration(data?.duration || 0);
              setIsLoading(false);
              setIsBuffering(false);
            }}
            onProgress={(data) => setPosition(data?.currentTime || 0)}
            onEnd={() => {
              setPosition(duration);
              setShowControls(true);
            }}
            onError={handleError}
            onBuffer={({ isBuffering: buffering }) => {
              setIsBuffering(buffering);
              if (buffering) setIsLoading(false);
            }}
          />

          {isLoading && (
            <View style={styles.overlayCenter} pointerEvents="none">
              <ActivityIndicator size="large" color="#6C63FF" />
              <Text style={styles.overlayText}>Loading video...</Text>
            </View>
          )}

          {!isLoading && isBuffering && (
            <View style={styles.overlayCenter} pointerEvents="none">
              <ActivityIndicator size="large" color="#6C63FF" />
              <Text style={styles.overlayText}>Buffering...</Text>
            </View>
          )}

          {showControls && !isLoading && (
            <View style={styles.overlayCenter} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayback}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#6C63FF', '#4A3FF5']}
                  style={[
                    styles.playButtonGradient,
                    {
                      width: isTablet ? 96 : 76,
                      height: isTablet ? 96 : 76,
                      borderRadius: isTablet ? 48 : 38,
                    },
                  ]}
                >
                  <Icon
                    name={isPlaying ? 'pause' : 'play'}
                    size={isTablet ? 44 : 34}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          <View
            style={styles.track}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
          >
            <View style={styles.trackBase} />
            <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
            <View
              style={[
                styles.trackThumb,
                { left: `${progress * 100}%` },
              ]}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => videoRef.current?.seek(Math.max(0, position - 10))}
              activeOpacity={0.7}
            >
              <Icon name="play-back" size={22} color="#FFFFFF" />
              <Text style={styles.controlButtonLabel}>10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButtonMain}
              onPress={togglePlayback}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#6C63FF', '#4A3FF5']}
                style={styles.controlButtonMainGradient}
              >
                <Icon
                  name={isPlaying ? 'pause' : 'play'}
                  size={22}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() =>
                videoRef.current?.seek(Math.min(duration || 0, position + 10))
              }
              activeOpacity={0.7}
            >
              <Icon name="play-forward" size={22} color="#FFFFFF" />
              <Text style={styles.controlButtonLabel}>10</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meta */}
        <ScrollView
          style={styles.metaScroll}
          contentContainerStyle={styles.metaContent}
          showsVerticalScrollIndicator={false}
        >
          {currentMovie.thumbnail ? (
            <Image
              source={{ uri: currentMovie.thumbnail }}
              style={styles.poster}
            />
          ) : null}

          <View style={styles.metaTextWrap}>
            <Text style={styles.metaTitle}>
              {currentMovie.title || 'Untitled'}
            </Text>
            <View style={styles.metaRow}>
              {currentMovie.rating ? (
                <View style={styles.metaChip}>
                  <Icon name="star" size={12} color="#FFD700" />
                  <Text style={styles.metaChipText}>{currentMovie.rating}</Text>
                </View>
              ) : null}
              {currentMovie.year ? (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{currentMovie.year}</Text>
                </View>
              ) : null}
              {currentMovie.duration ? (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{currentMovie.duration}</Text>
                </View>
              ) : null}
            </View>
            {currentMovie.description ? (
              <Text style={styles.metaDescription} numberOfLines={4}>
                {currentMovie.description}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallPhone ? 12 : 16,
    paddingVertical: isSmallPhone ? 10 : 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  headerTitle: {
    fontSize: getFontSize(17),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: { fontSize: getFontSize(12), color: '#9CA3AF', marginTop: 2 },
  stage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { width: '100%', height: '100%', backgroundColor: '#000000' },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: getFontSize(14),
  },
  playButton: { borderRadius: 999 },
  playButtonGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeText: { fontSize: getFontSize(12), color: '#9CA3AF' },
  track: {
    height: 24,
    justifyContent: 'center',
  },
  trackBase: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  trackFill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6C63FF',
  },
  trackThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginLeft: -7,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 24,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  controlButtonLabel: {
    position: 'absolute',
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  controlButtonMain: { borderRadius: 24, overflow: 'hidden' },
  controlButtonMainGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaScroll: { flex: 1 },
  metaContent: {
    flexDirection: 'row',
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 14,
  },
  poster: {
    width: 90,
    height: 130,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  metaTextWrap: { flex: 1 },
  metaTitle: {
    fontSize: getFontSize(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaChipText: { color: '#D1D5DB', fontSize: getFontSize(12) },
  metaDescription: {
    color: '#9CA3AF',
    fontSize: getFontSize(13),
    lineHeight: 20,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIconWrapper: { marginBottom: 20 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: getFontSize(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: getFontSize(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 21,
  },
  browseButton: { borderRadius: 12, overflow: 'hidden' },
  browseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: getFontSize(15),
    fontWeight: '600',
  },
});

export default NowPlayingScreen;
