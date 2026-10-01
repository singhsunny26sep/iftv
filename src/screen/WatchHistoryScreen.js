import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import authService from '../api/auth';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const getFontSize = (size) => {
  if (isTablet) return size * 1.2;
  if (isSmallPhone) return size * 0.85;
  return size;
};

const WatchHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWatchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = user?.token;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await authService.getUser(token);
      if (response.success) {
        const userData = response.user;
        const watchHistory = userData?.watchHistory || [];
        setHistory(Array.isArray(watchHistory) ? watchHistory : []);
      } else {
        setError(response.message || 'Failed to load watch history');
      }
    } catch (err) {
      console.error('Error fetching watch history:', err);
      setError(err.message || 'Failed to load watch history');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchWatchHistory();
  }, [fetchWatchHistory]);

  const handlePlayVideo = (videoUrl) => {
    if (!videoUrl) {
      Alert.alert('Error', 'No video URL available');
      return;
    }
    navigation.navigate('MovieDetail', {
      movie: {
        title: 'Watched Content',
        thumbnail: 'https://placehold.co/300x450/4A6BFF/FFFFFF?text=Video',
        videoUrl: videoUrl,
        rating: 0,
        year: new Date().getFullYear(),
        genre: 'Video',
        duration: '0m 0s',
        description: 'Previously watched content',
        casts: [],
        languages: [],
        releaseDate: new Date().toISOString(),
      },
    });
  };

  const renderHistoryItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handlePlayVideo(item.videoUrl || item.url)}
      activeOpacity={0.7}
    >
      <View style={styles.historyNumber}>{index + 1}</View>
      <Image
        source={{
          uri: item.thumbnail || item.image || 'https://placehold.co/120x180/1A1A2E/6C63FF?text=Video',
        }}
        style={styles.historyImage}
      />
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle} numberOfLines={1}>
          {item.title || 'Watched Content'}
        </Text>
        <Text style={styles.historyMeta}>
          {item.year ? `${item.year} • ` : ''}
          {item.duration || 'Unknown'}
        </Text>
        <Text style={styles.historyDate}>
          {item.watchedAt || item.lastWatched || 'Recently'}
        </Text>
      </View>
      <Icon name="play-circle" size={24} color="#6C63FF" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading watch history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchWatchHistory} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Watch History</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Icon name="trash-outline" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="time-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyTitle}>No Watch History</Text>
          <Text style={styles.emptyText}>Movies and shows you watch will appear here</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Main', { screen: 'Home' })}
            activeOpacity={0.7}
          >
            <LinearGradient colors={['#6C63FF', '#4A3FF5']} style={styles.browseGradient}>
              <Text style={styles.browseButtonText}>Browse Movies</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => item._id || item.id || `history-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { fontSize: getFontSize(20), fontWeight: 'bold', color: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#9CA3AF', marginTop: 12, fontSize: getFontSize(15) },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  errorText: { color: '#FF6B6B', fontSize: getFontSize(16), textAlign: 'center', marginTop: 16, marginBottom: 20 },
  retryButton: { backgroundColor: '#4A6BFF', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontSize: getFontSize(15), fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: getFontSize(22), fontWeight: 'bold', color: '#FFFFFF', marginTop: 16 },
  emptyText: { fontSize: getFontSize(14), color: '#6B7280', marginTop: 8, textAlign: 'center', marginBottom: 24 },
  browseButton: { borderRadius: 8, overflow: 'hidden' },
  browseGradient: { paddingHorizontal: 30, paddingVertical: 12 },
  browseButtonText: { color: '#FFFFFF', fontSize: getFontSize(15), fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  historyNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyImage: { width: 70, height: 100, borderRadius: 8, marginRight: 12 },
  historyInfo: { flex: 1 },
  historyTitle: { color: '#FFFFFF', fontSize: getFontSize(15), fontWeight: '600', marginBottom: 4 },
  historyMeta: { color: '#9CA3AF', fontSize: getFontSize(12), marginBottom: 2 },
  historyDate: { color: '#6C63FF', fontSize: getFontSize(11), marginTop: 2 },
});

export default WatchHistoryScreen;