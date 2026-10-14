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
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import { usePlayer, buildVideoSource } from '../contexts/PlayerContext';

const { width, height } = Dimensions.get('window');
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
  const pad = (n) => String(n).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
};

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

// ============================================================
// 🌊 Animated Ambient Background
// ============================================================
const AmbientBackground = () => {
  const move = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(move, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(move, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [move]);

  const tx1 = move.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });
  const ty1 = move.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });
  const tx2 = move.interpolate({ inputRange: [0, 1], outputRange: [40, -40] });
  const ty2 = move.interpolate({ inputRange: [0, 1], outputRange: [30, -30] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.ambientBlob,
          styles.ambient1,
          { transform: [{ translateX: tx1 }, { translateY: ty1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientBlob,
          styles.ambient2,
          { transform: [{ translateX: tx2 }, { translateY: ty2 }] },
        ]}
      />
    </View>
  );
};

// ============================================================
// 💫 Ripple Effect on Double-Tap
// ============================================================
const SeekRipple = ({ visible, side, onComplete }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    opacity.setValue(1);
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onCompleteRef.current) onCompleteRef.current();
    });
  }, [visible, scale, opacity]);

  if (!visible) return null;

  const scaleInterp = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1.8],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ripple,
        side === 'left' ? styles.rippleLeft : styles.rippleRight,
        { opacity, transform: [{ scale: scaleInterp }] },
      ]}>
      <Icon
        name={side === 'left' ? 'play-back' : 'play-forward'}
        size={40}
        color="#FFFFFF"
      />
      <Text style={styles.rippleText}>10s</Text>
    </Animated.View>
  );
};

// ============================================================
// 🎯 Custom Seek Bar with Drag Support
// ============================================================
const SeekBar = ({ position, duration, buffered, onSeek, onLayoutWidth }) => {
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const bufferedRatio = duration > 0 ? Math.min(1, buffered / duration) : 0;
  const [trackW, setTrackW] = useState(0);
  const trackLeftRef = useRef(0);
  const trackRef = useRef(null);

  const handleLayout = (e) => {
    const w = e.nativeEvent.layout.width;
    setTrackW(w);
    onLayoutWidth && onLayoutWidth(w);
    if (trackRef.current && trackRef.current.measureInWindow) {
      trackRef.current.measureInWindow((x) => {
        trackLeftRef.current = x;
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (!trackW) return;
        const ratio = Math.max(
          0,
          Math.min(1, evt.nativeEvent.locationX / trackW),
        );
        onSeek(ratio);
      },
      onPanResponderMove: (evt, g) => {
        if (!trackW) return;
        const x = g.moveX - trackLeftRef.current;
        const ratio = Math.max(0, Math.min(1, x / trackW));
        onSeek(ratio);
      },
    }),
  ).current;

  return (
    <View style={styles.seekRow}>
      <Text style={styles.timeLabel}>{formatTime(position)}</Text>

      <View
        ref={trackRef}
        style={styles.seekTrackWrap}
        onLayout={handleLayout}
        {...panResponder.panHandlers}>
        <View style={styles.seekTrackBase} />
        <View
          style={[
            styles.seekTrackBuffered,
            { width: `${bufferedRatio * 100}%` },
          ]}
        />
        <LinearGradient
          colors={['#8B7FFF', '#6C63FF', '#4A3FF5']}
          style={[styles.seekTrackFill, { width: `${progress * 100}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={[styles.seekThumb, { left: `${progress * 100}%` }]}>
          <View style={styles.seekThumbGlow} />
          <LinearGradient
            colors={['#FFFFFF', '#E0DCFF']}
            style={styles.seekThumbInner}
          />
        </View>
      </View>

      <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
    </View>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
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
  const [buffered, setBuffered] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [volume, setVolume] = useState(1);
  const [screenBrightness, setScreenBrightness] = useState(1);
  const [rippleSide, setRippleSide] = useState(null);
  const [showVolumeHUD, setShowVolumeHUD] = useState(false);
  const [showBrightnessHUD, setShowBrightnessHUD] = useState(false);
  const [showSkipHUD, setShowSkipHUD] = useState(null);

  // Separate refs
  const portraitVideoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);
  const lastTapRef = useRef({ time: 0, side: null });
  const hudTimer = useRef(null);
  const resumePositionRef = useRef(0);

  // Animations (only fade-in on mount + skip HUD)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const skipScaleAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    setIsLoading(true);
    setDuration(0);
    setPosition(0);
    setBuffered(0);
  }, [playerKey, currentMovie?.videoUrl]);

  // Cleanup orientation on unmount
  useEffect(() => {
    return () => {
      try {
        Orientation.lockToPortrait();
        Orientation.unlockAllOrientations();
      } catch (e) {
        // no-op
      }
    };
  }, []);

  const showHUD = (type) => {
    if (hudTimer.current) clearTimeout(hudTimer.current);
    if (type === 'volume') setShowVolumeHUD(true);
    if (type === 'brightness') setShowBrightnessHUD(true);
    hudTimer.current = setTimeout(() => {
      setShowVolumeHUD(false);
      setShowBrightnessHUD(false);
    }, 1200);
  };

  const getActiveVideoRef = useCallback(() => {
    return isFullscreen ? fullscreenVideoRef.current : portraitVideoRef.current;
  }, [isFullscreen]);

  const seekToRatio = useCallback(
    (ratio) => {
      if (!duration) return;
      const target = Math.max(0, Math.min(duration, ratio * duration));
      const ref = getActiveVideoRef();
      if (ref && typeof ref.seek === 'function') {
        ref.seek(target);
        setPosition(target);
        resumePositionRef.current = target;
      }
    },
    [duration, getActiveVideoRef],
  );

  const seekBy = useCallback(
    (seconds) => {
      if (!duration) return;
      const target = Math.max(0, Math.min(duration, position + seconds));
      const ref = getActiveVideoRef();
      if (!ref || typeof ref.seek !== 'function') return;

      ref.seek(target);
      setPosition(target);
      resumePositionRef.current = target;

      setShowSkipHUD(seconds > 0 ? '+10s' : '-10s');
      skipScaleAnim.setValue(0);
      Animated.spring(skipScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();

      if (hudTimer.current) clearTimeout(hudTimer.current);
      hudTimer.current = setTimeout(() => setShowSkipHUD(null), 700);
    },
    [duration, position, getActiveVideoRef, skipScaleAnim],
  );

  // Only double-tap seek now — no single-tap controls toggle
  const handleVideoTap = (evt) => {
    const now = Date.now();
    const tapX = evt.nativeEvent.locationX;
    const side = tapX < width / 2 ? 'left' : 'right';
    const isDoubleTap = now - lastTapRef.current.time < 300;

    if (isDoubleTap && lastTapRef.current.side === side) {
      seekBy(side === 'left' ? -10 : 10);
      setRippleSide(side);
      lastTapRef.current = { time: 0, side: null };
    } else {
      lastTapRef.current = { time: now, side };
    }
  };

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
      ],
    );
  };

  const handleGoBack = () => {
    if (isFullscreen) {
      exitFullscreen();
      return;
    }
    stop();
    if (navigation.canGoBack()) navigation.goBack();
  };

  const enterFullscreen = () => {
    resumePositionRef.current = position;
    setIsFullscreen(true);
    try {
      Orientation.lockToLandscape();
    } catch (e) {
      // no-op
    }
  };

  const exitFullscreen = () => {
    resumePositionRef.current = position;
    setIsFullscreen(false);
    try {
      Orientation.lockToPortrait();
    } catch (e) {
      // no-op
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  };

  const cycleSpeed = () => {
    setShowSpeedMenu(true);
  };

  const selectSpeed = (s) => {
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  // --- Empty state ---
  if (!currentMovie) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <LinearGradient
          colors={['#0a0e27', '#1a1f4e']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <AmbientBackground />
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>Now Playing</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.emptyContainer}>
            <Animated.View
              style={[styles.emptyIconWrapper, { opacity: fadeAnim }]}>
              <LinearGradient
                colors={['#6C63FF', '#4A3FF5']}
                style={styles.emptyIcon}>
                <Icon name="play-circle" size={40} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.emptyIconGlow} />
            </Animated.View>
            <Text style={styles.emptyTitle}>Nothing Playing</Text>
            <Text style={styles.emptySubtext}>
              Pick a movie from Home and it will start playing here.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#6C63FF', '#4A3FF5']}
                style={styles.browseGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
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

  // ============================================================
  // FULLSCREEN MODE — Controls always visible
  // ============================================================
  if (isFullscreen) {
    return (
      <View style={styles.fullscreenContainer}>
        <StatusBar hidden />
        <TouchableWithoutFeedback onPress={handleVideoTap}>
          <View style={styles.fullscreenStage}>
            <Video
              ref={fullscreenVideoRef}
              key={`fs-${playerKey}`}
              source={source}
              style={styles.fullscreenVideo}
              paused={!isPlaying}
              resizeMode="contain"
              controls={false}
              volume={volume}
              rate={speed}
              initialTime={resumePositionRef.current}
              onLoad={(data) => {
                setDuration(data?.duration || 0);
                setIsLoading(false);
                setIsBuffering(false);
                if (resumePositionRef.current > 0 && fullscreenVideoRef.current) {
                  fullscreenVideoRef.current.seek(resumePositionRef.current);
                }
              }}
              onProgress={(data) => {
                setPosition(data?.currentTime || 0);
                if (data?.playableDuration) setBuffered(data.playableDuration);
              }}
              onEnd={() => {
                setPosition(duration);
              }}
              onError={handleError}
              onBuffer={({ isBuffering: b }) => {
                setIsBuffering(b);
                if (b) setIsLoading(false);
              }}
            />

            {(isLoading || isBuffering) && (
              <View style={styles.overlayCenter} pointerEvents="none">
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={styles.overlayText}>
                  {isLoading ? 'Loading video...' : 'Buffering...'}
                </Text>
              </View>
            )}

            <SeekRipple
              visible={rippleSide === 'left'}
              side="left"
              onComplete={() => setRippleSide(null)}
            />
            <SeekRipple
              visible={rippleSide === 'right'}
              side="right"
              onComplete={() => setRippleSide(null)}
            />

            {/* Controls overlay — ALWAYS visible (unless locked) */}
            <View
              pointerEvents={isLocked ? 'box-none' : 'auto'}
              style={styles.fsControlsOverlay}>
              {!isLocked && (
                <LinearGradient
                  colors={['rgba(0,0,0,0.75)', 'transparent']}
                  style={styles.fsTopBar}>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleGoBack}
                    activeOpacity={0.7}>
                    <Icon name="chevron-back" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                      {currentMovie.title || 'Now Playing'}
                    </Text>
                    {currentMovie.year ? (
                      <Text style={styles.headerSubtitle}>
                        {currentMovie.year}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setIsLocked(true)}
                    activeOpacity={0.7}>
                    <Icon name="lock-open-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>
              )}

              {!isLocked && (
                <View style={styles.fsCenterControls} pointerEvents="box-none">
                  <TouchableOpacity
                    style={styles.fsSideControl}
                    onPress={() => seekBy(-10)}
                    activeOpacity={0.7}>
                    <Icon name="play-back" size={32} color="#FFFFFF" />
                    <Text style={styles.fsSideLabel}>10</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={togglePlayback}
                    activeOpacity={0.85}
                    style={styles.fsMainPlay}>
                    <LinearGradient
                      colors={['#6C63FF', '#4A3FF5']}
                      style={styles.fsMainPlayGradient}>
                      <Icon
                        name={isPlaying ? 'pause' : 'play'}
                        size={36}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.fsSideControl}
                    onPress={() => seekBy(10)}
                    activeOpacity={0.7}>
                    <Icon name="play-forward" size={32} color="#FFFFFF" />
                    <Text style={styles.fsSideLabel}>10</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!isLocked && (
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  style={styles.fsBottomBar}>
                  <SeekBar
                    position={position}
                    duration={duration}
                    buffered={buffered}
                    onSeek={seekToRatio}
                    onLayoutWidth={setTrackWidth}
                  />

                  <View style={styles.fsBottomRow}>
                    <TouchableOpacity
                      onPress={cycleSpeed}
                      style={styles.fsIconBtn}
                      activeOpacity={0.7}>
                      <Text style={styles.fsSpeedText}>{speed}x</Text>
                    </TouchableOpacity>

                    <View style={{ flex: 1 }} />

                    <TouchableOpacity
                      onPress={toggleFullscreen}
                      style={styles.fsIconBtn}
                      activeOpacity={0.7}>
                      <Icon name="contract-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              )}

              {isLocked && (
                <TouchableOpacity
                  style={styles.lockButton}
                  onPress={() => setIsLocked(false)}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                    style={styles.lockButtonGradient}>
                    <Icon name="lock-closed" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {showVolumeHUD && (
              <View style={styles.hudWrap} pointerEvents="none">
                <View style={styles.hudBubble}>
                  <Icon name="volume-high" size={22} color="#FFFFFF" />
                  <Text style={styles.hudText}>
                    {Math.round(volume * 100)}%
                  </Text>
                </View>
              </View>
            )}
            {showBrightnessHUD && (
              <View style={styles.hudWrap} pointerEvents="none">
                <View style={styles.hudBubble}>
                  <Icon name="sunny" size={22} color="#FFFFFF" />
                  <Text style={styles.hudText}>
                    {Math.round(screenBrightness * 100)}%
                  </Text>
                </View>
              </View>
            )}

            {showSkipHUD && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.skipHUD,
                  {
                    transform: [
                      {
                        scale: skipScaleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.7, 1],
                        }),
                      },
                    ],
                  },
                ]}>
                <Text style={styles.skipHUDText}>{showSkipHUD}</Text>
              </Animated.View>
            )}

            {showSpeedMenu && (
              <TouchableWithoutFeedback
                onPress={() => setShowSpeedMenu(false)}>
                <View style={styles.speedMenuOverlay}>
                  <View style={styles.speedMenu}>
                    <Text style={styles.speedMenuTitle}>Playback Speed</Text>
                    {SPEEDS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.speedItem,
                          s === speed && styles.speedItemActive,
                        ]}
                        onPress={() => selectSpeed(s)}>
                        <Text
                          style={[
                            styles.speedItemText,
                            s === speed && styles.speedItemTextActive,
                          ]}>
                          {s}x
                        </Text>
                        {s === speed && (
                          <Icon
                            name="checkmark"
                            size={18}
                            color="#6C63FF"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  // ============================================================
  // PORTRAIT MODE — Controls always visible
  // ============================================================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={['#0a0e27', '#1a1f4e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <AmbientBackground />

        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleGoBack}
            activeOpacity={0.7}>
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
            onPress={toggleFullscreen}
            activeOpacity={0.7}>
            <Icon name="expand-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.stageWrap}>
          <LinearGradient
            colors={[
              'rgba(108,99,255,0.4)',
              'transparent',
              'rgba(108,99,255,0.2)',
            ]}
            style={styles.stageGlow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <TouchableWithoutFeedback onPress={handleVideoTap}>
            <View style={styles.stage}>
              <Video
                ref={portraitVideoRef}
                key={playerKey}
                source={source}
                style={styles.video}
                paused={!isPlaying}
                resizeMode="contain"
                controls={false}
                repeat={false}
                volume={volume}
                rate={speed}
                initialTime={resumePositionRef.current}
                onLoad={(data) => {
                  setDuration(data?.duration || 0);
                  setIsLoading(false);
                  setIsBuffering(false);
                  if (resumePositionRef.current > 0 && portraitVideoRef.current) {
                    portraitVideoRef.current.seek(resumePositionRef.current);
                  }
                }}
                onProgress={(data) => {
                  setPosition(data?.currentTime || 0);
                  if (data?.playableDuration)
                    setBuffered(data.playableDuration);
                }}
                onEnd={() => {
                  setPosition(duration);
                }}
                onError={handleError}
                onBuffer={({ isBuffering: b }) => {
                  setIsBuffering(b);
                  if (b) setIsLoading(false);
                }}
              />

              {(isLoading || isBuffering) && (
                <View style={styles.overlayCenter} pointerEvents="none">
                  <ActivityIndicator size="large" color="#6C63FF" />
                  <Text style={styles.overlayText}>
                    {isLoading ? 'Loading video...' : 'Buffering...'}
                  </Text>
                </View>
              )}

              <SeekRipple
                visible={rippleSide === 'left'}
                side="left"
                onComplete={() => setRippleSide(null)}
              />
              <SeekRipple
                visible={rippleSide === 'right'}
                side="right"
                onComplete={() => setRippleSide(null)}
              />

              {showSkipHUD && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.skipHUD,
                    {
                      transform: [
                        {
                          scale: skipScaleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.7, 1],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <Text style={styles.skipHUDText}>{showSkipHUD}</Text>
                </Animated.View>
              )}

              {/* Center Play Button — ALWAYS visible */}
              {!isLoading && (
                <View style={styles.overlayCenter} pointerEvents="box-none">
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={togglePlayback}
                    activeOpacity={0.85}>
                    <LinearGradient
                      colors={['#6C63FF', '#4A3FF5']}
                      style={[
                        styles.playButtonGradient,
                        {
                          width: isTablet ? 96 : 76,
                          height: isTablet ? 96 : 76,
                          borderRadius: isTablet ? 48 : 38,
                        },
                      ]}>
                      <Icon
                        name={isPlaying ? 'pause' : 'play'}
                        size={isTablet ? 44 : 34}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Controls — ALWAYS visible */}
        <View style={styles.controls}>
          <SeekBar
            position={position}
            duration={duration}
            buffered={buffered}
            onSeek={seekToRatio}
            onLayoutWidth={setTrackWidth}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => seekBy(-10)}
              activeOpacity={0.7}>
              <Icon name="play-back" size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonLabel}>10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButtonMain}
              onPress={togglePlayback}
              activeOpacity={0.85}>
              <LinearGradient
                colors={['#6C63FF', '#4A3FF5']}
                style={styles.controlButtonMainGradient}>
                <Icon
                  name={isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => seekBy(10)}
              activeOpacity={0.7}>
              <Icon name="play-forward" size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonLabel}>10</Text>
            </TouchableOpacity>

            <View style={styles.controlDivider} />

            <TouchableOpacity
              style={styles.controlButtonSpeed}
              onPress={cycleSpeed}
              activeOpacity={0.7}>
              <Text style={styles.controlButtonSpeedText}>{speed}x</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFullscreen}
              activeOpacity={0.7}>
              <Icon name="expand-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.metaScroll}
          contentContainerStyle={styles.metaContent}
          showsVerticalScrollIndicator={false}>
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
                  <Text style={styles.metaChipText}>
                    {currentMovie.duration}
                  </Text>
                </View>
              ) : null}
            </View>
            {currentMovie.description ? (
              <Text style={styles.metaDescription} numberOfLines={5}>
                {currentMovie.description}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        {showSpeedMenu && (
          <TouchableWithoutFeedback onPress={() => setShowSpeedMenu(false)}>
            <View style={styles.speedMenuOverlay}>
              <View style={styles.speedMenu}>
                <Text style={styles.speedMenuTitle}>Playback Speed</Text>
                {SPEEDS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.speedItem,
                      s === speed && styles.speedItemActive,
                    ]}
                    onPress={() => selectSpeed(s)}>
                    <Text
                      style={[
                        styles.speedItemText,
                        s === speed && styles.speedItemTextActive,
                      ]}>
                      {s}x
                    </Text>
                    {s === speed && (
                      <Icon name="checkmark" size={18} color="#6C63FF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  gradient: { flex: 1 },

  ambientBlob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.18,
  },
  ambient1: {
    width: 300,
    height: 300,
    backgroundColor: '#6C63FF',
    top: 50,
    left: -100,
  },
  ambient2: {
    width: 250,
    height: 250,
    backgroundColor: '#FF5E7E',
    bottom: 200,
    right: -80,
  },

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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerSpacer: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  headerTitle: {
    fontSize: getFontSize(17),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: getFontSize(12),
    color: '#9CA3AF',
    marginTop: 2,
  },

  stageWrap: {
    position: 'relative',
  },
  stageGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 8,
    opacity: 0.5,
  },
  stage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },

  ripple: {
    position: 'absolute',
    top: '50%',
    marginTop: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(108,99,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  rippleLeft: { left: 20 },
  rippleRight: { right: 20 },
  rippleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  skipHUD: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipHUDText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  controls: {
    paddingHorizontal: isSmallPhone ? 16 : 20,
    paddingTop: 16,
    paddingBottom: 12,
  },

  seekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: getFontSize(11),
    color: '#9CA3AF',
    fontWeight: '600',
    minWidth: 36,
  },
  seekTrackWrap: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  seekTrackBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  seekTrackBuffered: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  seekTrackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  seekThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    marginLeft: -9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekThumbGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    opacity: 0.35,
  },
  seekThumbInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  controlButtonLabel: {
    position: 'absolute',
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  controlButtonMain: { borderRadius: 28, overflow: 'hidden' },
  controlButtonMainGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  controlButtonSpeed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108,99,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonSpeedText: {
    color: '#A79BFF',
    fontSize: 12,
    fontWeight: '800',
  },
  controlDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metaTextWrap: { flex: 1 },
  metaTitle: {
    fontSize: getFontSize(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(108,99,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  metaChipText: {
    color: '#D1D5DB',
    fontSize: getFontSize(12),
    fontWeight: '600',
  },
  metaDescription: {
    color: '#9CA3AF',
    fontSize: getFontSize(13),
    lineHeight: 20,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIconWrapper: { marginBottom: 20, position: 'relative' },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  emptyIconGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 50,
    backgroundColor: '#6C63FF',
    opacity: 0.2,
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

  // FULLSCREEN
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenStage: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  fsControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  fsTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fsCenterControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  fsSideControl: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  fsSideLabel: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  fsMainPlay: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  fsMainPlayGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  fsBottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 20,
  },
  fsBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  fsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  fsSpeedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  lockButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  lockButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  hudWrap: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  hudBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  hudText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  speedMenuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  speedMenu: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  speedMenuTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  speedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  speedItemActive: {
    backgroundColor: 'rgba(108,99,255,0.15)',
  },
  speedItemText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  speedItemTextActive: {
    color: '#6C63FF',
    fontWeight: '800',
  },
});

export default NowPlayingScreen;