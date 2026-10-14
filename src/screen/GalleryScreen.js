import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { getGallery } from '../api/gallery';
import { moderateScale } from '../utils/Scalling';
const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;
const COLUMNS = isTablet ? 4 : isSmallPhone ? 2 : 3;
const PAGE_LIMIT = 20;
const H_GAP = 8;
const ITEM_W = Math.floor((width - 16 - (COLUMNS - 1) * H_GAP) / COLUMNS);

const previewThumb = (item) => {
  if (!item) return null;
  return item.mediaType === 'video' ? item.poster || item.media || null : item.media || null;
};

// Full-resolution url opened on tap (Cloudflare `/public`).
const fullRes = (item) => {
  if (!item) return null;
  return item.mediaType === 'video' ? item.poster || item.fullMedia || null : item.fullMedia || null;
};

const VideoPlayerModal = ({ visible, source, onClose, videoRef }) => {
  const [paused, setPaused] = useState(false);
  const toggle = () => setPaused((p) => !p);
  useEffect(() => {
    if (visible) setPaused(false);
  }, [visible]);
  return (
    <Modal animationType="slide" visible={visible} statusBarTranslucent>
      <View style={styles.videoContainer}>
        <TouchableOpacity
          style={styles.videoCloseButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Icon name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.videoPlayerContainer}
          onPress={toggle}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            source={source}
            style={styles.videoPlayer}
            paused={paused}
            resizeMode="contain"
            controls={false}
            repeat={false}
          />
          {paused && (
            <View style={styles.playButtonOverlay}>
              <Icon name="play-circle" size={80} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const GalleryScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState(new Set());

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  const headerStyle = {
    opacity: headerAnim,
    transform: [
      {
        translateY: headerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  };

  const videoRef = useRef(null);

  const loadPage = useCallback(
    async (pageNum, { isRefresh = false } = {}) => {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      setError(null);
      try {
        const res = await getGallery({ page: pageNum, limit: PAGE_LIMIT });
        const next = (res.data || []).filter(Boolean);
        setItems(isRefresh ? next : (prev) => [...prev, ...next]);
        setTotalPages(res.totalPages || 0);
        setPage(res.page || pageNum);
      } catch (e) {
        setError(e.message || 'Failed to load gallery');
        if (pageNum === 1 && !isRefresh) setItems([]);
      } finally {
        setRefreshing(false);
        if (pageNum === 1) setLoading(false);
      }
    },
    [],
  );
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);
  const onRefresh = () => loadPage(1, { isRefresh: true });
  const onEndReached = () => {
    if (loading || refreshing) return;
    if (page < totalPages) loadPage(page + 1);
  };
  const openItem = (item) => {
    const playable = !!item.hlsUrl;
    if (playable) {
      setVideoOpen(true);
    }
    setViewer(item);
  };
  const closeViewer = () => {
    setViewer(null);
    setVideoOpen(false);
    if (videoRef.current) {
      try {
        videoRef.current.seek(0);
      } catch (e) {}
    }
  };

  const renderItem = ({ item }) => {
    const broken = brokenImages.has(item.id);
    const thumb = previewThumb(item);
    const showImage = thumb && !broken;
    const isVideo = item.mediaType === 'video';
    const duration = item.duration;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => openItem(item)}
      >
        <View style={styles.imageWrap}>
          {showImage ? (
            <Image
              source={{ uri: thumb }}
              style={styles.image}
              onError={() => setBrokenImages((b) => new Set(b).add(item.id))}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Icon name="image-outline" size={28} color="#6B7280" />
            </View>
          )}
{isVideo && (
            <View style={styles.playBadge}>
              <LinearGradient
                colors={['#7C74FF', '#5A4DF0']}
                style={styles.playBadgeInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="play" size={moderateScale(14)} color="#FFFFFF" />
              </LinearGradient>
            </View>
          )}
          {item.mediaType === 'gif' && (
            <View style={styles.gifBadge}>
              <Text style={styles.gifBadgeText}>GIF</Text>
            </View>
          )}
          {duration ? <Text style={styles.durationBadge}>{duration}</Text> : null}
        </View>
        {item.title ? (
          <Text style={styles.caption} numberOfLines={1}>
            {item.title}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyArea}>
        <View style={styles.emptyIconWrap}>
          <LinearGradient
            colors={['#7C74FF', '#5A4DF0']}
            style={styles.emptyIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="images-outline" size={32} color="#FFFFFF" />
          </LinearGradient>
        </View>
          <Text style={styles.emptyTitle}>Ye item ab available nahi hai</Text>
          <Text style={styles.emptyText}>Kuch dikhane ke liye nahi hai.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
      <LinearGradient
        colors={['#0a0e27', '#141A3F', '#0a0e27']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.header, headerStyle]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Gallery</Text>
            <Text style={styles.headerSubtitle}>{items.length} items</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <LinearGradient
              colors={['#7C74FF', '#5A4DF0']}
              style={styles.headerIconInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="images-outline" size={18} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </Animated.View>

        {error && !loading ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => loadPage(1)}
              activeOpacity={0.85}
            >
              <Icon name="reload" size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            numColumns={COLUMNS}
            key={COLUMNS}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.column}
            showsVerticalScrollIndicator={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && items.length > 0 ? (
                <ActivityIndicator color="#7C74FF" style={styles.footer} />
              ) : null
            }
            ListEmptyComponent={renderEmpty}
            refreshing={refreshing}
            onRefresh={onRefresh}
            removeClippedSubviews
          />
        )}

        <VideoPlayerModal
          visible={videoOpen}
          source={viewer?.hlsUrl ? { uri: viewer.hlsUrl } : undefined}
          onClose={closeViewer}
          videoRef={videoRef}
        />

        <Modal
          visible={!!viewer && !videoOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeViewer}
        >
          <TouchableWithoutFeedback onPress={closeViewer}>
            <View style={styles.fullscreenOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.fullscreenInner}>
                 {viewer?.mediaType === 'video' ? (
                     <Text style={styles.fullscreenHint}>
                       Missing playback URL for this video.
                     </Text>
                   ) : (
                     <Image
                       source={{ uri: fullRes(viewer) }}
                       style={viewer?.mediaType === 'gif' ? styles.fullscreenGif : styles.fullscreenImage}
                       resizeMode="contain"
                     />
                   )}
                  {viewer?.title ? (
                    <Text style={styles.fullscreenTitle}>{viewer.title}</Text>
                  ) : null}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default GalleryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSubtitle: {
    fontSize: moderateScale(11.5),
    color: '#9FB0D2',
    letterSpacing: 0.4,
  },
  headerIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
  },
  headerIconInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: { width: 36, alignItems: 'center' },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: isSmallPhone ? '600' : '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  listContent: { paddingHorizontal: 8, paddingBottom: 24 },
  column: { justifyContent: 'space-between' },
  card: {
    width: ITEM_W,
    marginBottom: 12,
    alignItems: 'center',
  },
  imageWrap: {
    width: ITEM_W,
    height: ITEM_W,
    borderRadius: isSmallPhone ? 8 : 10,
    overflow: 'hidden',
    backgroundColor: '#1a1f4e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#1a1f4e' },
  playBadge: {
    position: 'absolute',
    bottom: moderateScale(6),
    right: moderateScale(6),
  },
  playBadgeInner: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: moderateScale(4),
    left: moderateScale(6),
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    paddingHorizontal: moderateScale(6),
    paddingVertical: 1,
    borderRadius: 4,
  },
  gifBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gifBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  caption: {
    marginTop: 6,
    fontSize: moderateScale(11.5),
    color: '#9FB0D2',
    textAlign: 'center',
  },
  emptyArea: {
    alignItems: 'center',
    paddingTop: moderateScale(40),
  },
  emptyIconWrap: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    overflow: 'hidden',
    marginBottom: 12,
  },
  emptyIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptyText: { fontSize: moderateScale(12), color: '#6B7280' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  errorText: { color: '#FF6B6B', fontSize: moderateScale(13), marginBottom: 12 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#243057',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: { color: '#A79BFF', fontSize: moderateScale(12) },
  videoContainer: { flex: 1, backgroundColor: '#000000' },
  videoCloseButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 6,
  },
  videoPlayerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  videoPlayer: { width: '100%', height: '100%' },
  playButtonOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenInner: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: { width: '100%', maxHeight: '80%' },
  fullscreenGif: { width: '100%', maxHeight: '100%' },
  fullscreenTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  fullscreenHint: { color: '#9FB0D2', fontSize: moderateScale(13) },
  footer: { marginVertical: 16 },
});
