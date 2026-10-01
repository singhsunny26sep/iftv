import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const getFontSize = (size) => {
  if (isTablet) return size * 1.2;
  if (isSmallPhone) return size * 0.85;
  return size;
};

const GRID_GAP = isSmallPhone ? 10 : 12;
const GRIDE_PADDING = isSmallPhone ? 12 : 16;
const CARD_WIDTH =
  (width - GRIDE_PADDING * 2 - GRID_GAP * (isSmallPhone ? 1 : 2)) /
  (isSmallPhone ? 2 : 3);

// The likes endpoint is not exposed by the API yet, so entries arrive as a
// mix of full objects and bare ids. Normalise whatever we get to a shape the
// grid can render, and drop anything we cannot identify.
const normaliseLikes = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (item && typeof item === 'object') {
        return {
          id: item._id || item.id || item.movieId,
          title: item.title || item.name || 'Untitled',
          thumbnail: item.thumbnail || item.image || item.poster || null,
          videoUrl: item.videoUrl || item.video || item.url || null,
          rating: item.rating || item.imdbRating || 0,
          year: item.year || null,
        };
      }
      return null;
    })
    .filter((item) => item && item.id);
};

const LikeCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { width: CARD_WIDTH }]}
    onPress={() => onPress(item)}
    activeOpacity={0.85}
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
          <Icon name="film-outline" size={26} color="#6E7391" />
        </LinearGradient>
      )}

      {!!item.rating ? (
        <View style={styles.ratingBadge}>
          <Icon name="star" size={10} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      ) : null}

      <View style={styles.playOverlay}>
        <LinearGradient
          colors={['#7C74FF', '#5A4DF0']}
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
    {item.year ? <Text style={styles.cardMeta}>{item.year}</Text> : null}
  </TouchableOpacity>
);

const LikesScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const { playMovie } = usePlayer();

  const [likes, setLikes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Re-read the profile whenever the tab regains focus so likes stay in sync
  // with anything changed elsewhere in the app.
  useEffect(() => {
    setLikes(normaliseLikes(user?.favorites));
  }, [user?.favorites]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }, [refreshUser]);

  const handlePlay = (item) => {
    if (!item.videoUrl) {
      return;
    }
    const started = playMovie({
      title: item.title,
      thumbnail: item.thumbnail,
      videoUrl: item.videoUrl,
      rating: item.rating,
      year: item.year,
    });
    if (started) {
      navigation.navigate('Playing');
    }
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>My Likes</Text>
      <Text style={styles.subtitle}>
        {likes.length > 0
          ? `${likes.length} ${likes.length === 1 ? 'title' : 'titles'} saved`
          : 'Everything you love, in one place'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
      <LinearGradient
        colors={['#0a0e27', '#141A3F', '#0a0e27']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {likes.length > 0 ? (
          <FlatList
            data={likes}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <LikeCard item={item} onPress={handlePlay} />
            )}
            numColumns={isSmallPhone ? 2 : 3}
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
          />
        ) : (
          <View style={styles.emptyWrapper}>
            {header}

            <View style={styles.emptyArea}>
              <View style={styles.glowRingOuter}>
                <View style={styles.glowRingInner}>
                  <LinearGradient
                    colors={['#7C74FF', '#5A4DF0']}
                    style={styles.emptyIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="heart" size={34} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              </View>

              <Text style={styles.emptyTitle}>No likes yet</Text>
              <Text style={styles.emptyText}>
                Tap the heart on any movie you love and it will show up here
                for quick access.
              </Text>

              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('Home')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#7C74FF', '#5A4DF0']}
                  style={styles.browseGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="compass-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.browseText}>Discover movies</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  gradient: { flex: 1 },
  header: {
    paddingHorizontal: GRIDE_PADDING,
    paddingTop: 18,
    paddingBottom: 14,
  },
  title: {
    fontSize: getFontSize(24),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: getFontSize(13),
    color: '#7B8099',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: GRIDE_PADDING,
    paddingBottom: 140,
  },
  column: { gap: GRID_GAP, marginBottom: GRID_GAP },
  card: { marginBottom: 2 },
  cardPosterWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    aspectRatio: 2 / 3,
  },
  cardPoster: { width: '100%', height: '100%' },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: { color: '#FFD700', fontSize: 10, fontWeight: '700' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  // Empty state
  emptyWrapper: { flex: 1 },
  emptyArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 90,
  },
  glowRingOuter: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(124,116,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRingInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(124,116,255,0.12)',
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
});

export default LikesScreen;
