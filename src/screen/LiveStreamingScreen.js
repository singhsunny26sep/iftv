import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { usePlayer } from '../contexts/PlayerContext';
import { getAllLiveStreams, getLiveCategories } from '../api/live';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const getFontSize = (size) => {
  if (isTablet) return size * 1.2;
  if (isSmallPhone) return size * 0.85;
  return size;
};

const PAGE_BG = '#0a0e27';
const GRID_GAP = isSmallPhone ? 10 : 12;
const GRID_PADDING = isSmallPhone ? 14 : 18;
const CARD_WIDTH =
  (width - GRID_PADDING * 2 - GRID_GAP * (isSmallPhone ? 1 : 2)) /
  (isSmallPhone ? 2 : 3);

// Pulsing red dot used on the LIVE badges.
const LiveDot = ({ size = 6 }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.liveDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.35],
          }),
        },
      ]}
    />
  );
};

const LiveBadge = () => (
  <View style={styles.liveBadge}>
    <LiveDot />
    <Text style={styles.liveBadgeText}>LIVE</Text>
  </View>
);

const ChannelCard = ({ item, onPress }) => (
  <Pressable
    style={({ pressed }) => [
      styles.card,
      { width: CARD_WIDTH },
      pressed && styles.cardPressed,
    ]}
    onPress={() => onPress(item)}
  >
    <View style={styles.cardPosterWrap}>
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.cardPoster} />
      ) : (
        <LinearGradient
          colors={['#2A2F5C', '#1A1F4E']}
          style={styles.cardPoster}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="tv-outline" size={28} color="#6E7391" />
        </LinearGradient>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(10,14,39,0.85)']}
        style={styles.cardScrim}
      />

      <View style={styles.badgeRow}>
        <LiveBadge />
        {item.viewers ? (
          <View style={styles.viewerBadge}>
            <Icon name="eye-outline" size={10} color="#D1D5DB" />
            <Text style={styles.viewerText}>{formatViewers(item.viewers)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.playDotWrap}>
        <LinearGradient
          colors={['#FF5A5F', '#E03131']}
          style={styles.playDot}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="play" size={14} color="#FFFFFF" />
        </LinearGradient>
      </View>
    </View>

    <Text style={styles.cardTitle} numberOfLines={1}>
      {item.title}
    </Text>
    <Text style={styles.cardMeta} numberOfLines={1}>
      {item.language ? `${item.category} • ${item.language}` : item.category}
    </Text>
  </Pressable>
);

const CategoryChip = ({ label, selected, onPress }) => (
  <Pressable
    style={[styles.chip, selected && styles.chipActive]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
      {label}
    </Text>
  </Pressable>
);

function formatViewers(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

const LiveStreamingScreen = ({ navigation }) => {
  const { playMovie } = usePlayer();

  const [streams, setStreams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [streamList, categoryList] = await Promise.allSettled([
        getAllLiveStreams(),
        getLiveCategories(),
      ]);

      if (streamList.status === 'fulfilled') {
        setStreams(streamList.value);
      } else {
        setError(streamList.reason?.message || 'Failed to load live streams');
      }

      if (categoryList.status === 'fulfilled' && categoryList.value.length) {
        const names = categoryList.value
          .map(c => (typeof c === 'string' ? c : c?.name || c?.title))
          .filter(Boolean);
        setCategories(['All', ...names]);
      }
    } catch (err) {
      console.error('Error loading live TV:', err);
      setError('Something went wrong.');
    }
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();

    (async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    })();
  }, [loadData, fadeAnim]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const visibleStreams = useCallback(() => {
    if (selectedCategory === 'All') return streams;
    return streams.filter(s => s.category === selectedCategory);
  }, [streams, selectedCategory]);

  const handlePlay = (item) => {
    if (!item.streamUrl) {
      Alert.alert('Unavailable', 'This channel has no playable stream right now.');
      return;
    }
    const started = playMovie({
      title: item.title,
      thumbnail: item.thumbnail,
      videoUrl: item.streamUrl,
      description: item.description,
      genre: item.category,
    });
    if (started) {
      navigation.navigate('Playing');
    }
  };

  const header = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <LiveDot size={7} />
            <Text style={styles.headerIconText}>LIVE</Text>
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Live TV</Text>
            <Text style={styles.subtitle}>Streaming right now</Text>
          </View>
        </View>
        {streams.length > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{streams.length}</Text>
          </View>
        ) : null}
      </View>

      {categories.length > 1 ? (
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item, i) => `${item}-${i}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <CategoryChip
              label={item}
              selected={selectedCategory === item}
              onPress={() => setSelectedCategory(item)}
            />
          )}
        />
      ) : null}
    </View>
  );

  // --- Loading ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={PAGE_BG} />
        <LinearGradient
          colors={[PAGE_BG, '#1a1f4e', PAGE_BG]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#7C74FF" />
            <Text style={styles.centeredText}>Loading live channels...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={PAGE_BG} />
        <LinearGradient
          colors={[PAGE_BG, '#1a1f4e', PAGE_BG]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.centered}>
            <Icon name="alert-circle-outline" size={56} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData} activeOpacity={0.85}>
              <LinearGradient
                colors={['#7C74FF', '#5A4DF0']}
                style={styles.retryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const items = visibleStreams();

  // --- Empty ---
  if (streams.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={PAGE_BG} />
        <LinearGradient
          colors={[PAGE_BG, '#1a1f4e', PAGE_BG]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {header}
          <View style={styles.emptyArea}>
            <View style={styles.glowRingOuter}>
              <View style={styles.glowRingInner}>
                <LinearGradient
                  colors={['#FF5A5F', '#E03131']}
                  style={styles.emptyIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="tv-outline" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.emptyTitle}>No live channels yet</Text>
            <Text style={styles.emptyText}>
              Live TV channels will appear here as soon as they start
              broadcasting. Pull down to refresh.
            </Text>

            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Main', { screen: 'Home' })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#7C74FF', '#5A4DF0']}
                style={styles.browseGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="compass-outline" size={18} color="#FFFFFF" />
                <Text style={styles.browseText}>Browse on-demand</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // --- Grid ---
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={PAGE_BG} />
      <LinearGradient
        colors={[PAGE_BG, '#141A3F', PAGE_BG]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.FlatList
          style={{ opacity: fadeAnim }}
          data={items}
          keyExtractor={(item, i) => String(item.id ?? i)}
          numColumns={isSmallPhone ? 2 : 3}
          renderItem={({ item }) => (
            <ChannelCard item={item} onPress={handlePlay} />
          )}
          ListHeaderComponent={header}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7C74FF"
              colors={['#7C74FF']}
            />
          }
          ListEmptyComponent={
            <View style={styles.filterEmpty}>
              <Icon name="funnel-outline" size={28} color="#6E7391" />
              <Text style={styles.filterEmptyText}>
                No channels in {selectedCategory}
              </Text>
            </View>
          }
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAGE_BG },
  gradient: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,90,95,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,90,95,0.35)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 11,
  },
  headerIconText: {
    color: '#FF6B6B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  headerTextWrap: { flex: 1 },
  title: {
    fontSize: getFontSize(23),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subtitle: { fontSize: getFontSize(12.5), color: '#7B8099', marginTop: 3 },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,116,255,0.16)',
  },
  countText: {
    color: '#A79BFF',
    fontSize: getFontSize(12),
    fontWeight: '800',
  },
  // Chips
  chipRow: { paddingHorizontal: GRID_PADDING, gap: 8, paddingBottom: 14 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(124,116,255,0.16)',
    borderColor: '#7C74FF',
  },
  chipText: { color: '#9AA0B8', fontSize: getFontSize(12.5), fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  // Grid
  listContent: { paddingHorizontal: GRID_PADDING, paddingBottom: 140 },
  column: { gap: GRID_GAP, marginBottom: GRID_GAP },
  card: { marginBottom: 2 },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  cardPosterWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    aspectRatio: 3 / 4,
  },
  cardPoster: { width: '100%', height: '100%' },
  cardScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  badgeRow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(224,49,49,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveDot: { backgroundColor: '#FFFFFF' },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.68)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewerText: { color: '#D1D5DB', fontSize: 9.5, fontWeight: '600' },
  playDotWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cardTitle: {
    fontSize: getFontSize(13),
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  cardMeta: { fontSize: getFontSize(11), color: '#6E7391', marginTop: 2 },
  // Centered states
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  centeredText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: getFontSize(14),
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: getFontSize(15),
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 22,
  },
  retryButton: { borderRadius: 12, overflow: 'hidden' },
  retryGradient: { paddingHorizontal: 30, paddingVertical: 12 },
  retryText: { color: '#FFFFFF', fontSize: getFontSize(15), fontWeight: '700' },
  // Empty
  emptyArea: {
    alignItems: 'center',
    paddingHorizontal: 34,
    paddingTop: 46,
  },
  glowRingOuter: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(255,90,95,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRingInner: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: 'rgba(255,90,95,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: getFontSize(21),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: getFontSize(14),
    color: '#7B8099',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 26,
  },
  browseButton: { borderRadius: 14, overflow: 'hidden' },
  browseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 26,
    paddingVertical: 13,
  },
  browseText: {
    color: '#FFFFFF',
    fontSize: getFontSize(15),
    fontWeight: '700',
  },
  filterEmpty: { alignItems: 'center', paddingVertical: 48 },
  filterEmptyText: {
    color: '#7B8099',
    fontSize: getFontSize(13),
    marginTop: 10,
  },
});

export default LiveStreamingScreen;