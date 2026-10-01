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

const FavoritesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFavorites = useCallback(async () => {
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
        const favData = userData?.favorites || [];
        setFavorites(Array.isArray(favData) ? favData : []);
      } else {
        setError(response.message || 'Failed to load favorites');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handlePlayVideo = (videoUrl) => {
    if (!videoUrl) {
      Alert.alert('Error', 'No video URL available');
      return;
    }
    navigation.navigate('MovieDetail', {
      movie: {
        title: 'Favorite Content',
        thumbnail: 'https://placehold.co/300x450/6C63FF/FFFFFF?text=Favorite',
        videoUrl: videoUrl,
        rating: 0,
        year: new Date().getFullYear(),
        genre: 'Video',
        duration: '0m 0s',
        description: 'Your favorite content',
        casts: [],
        languages: [],
        releaseDate: new Date().toISOString(),
      },
    });
  };

  const renderFavoriteItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.favoriteItem}
      onPress={() => handlePlayVideo(item.videoUrl || item.url)}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: item.thumbnail || item.image || 'https://placehold.co/120x180/1A1A2E/6C63FF?text=Video',
        }}
        style={styles.favoriteImage}
      />
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteTitle} numberOfLines={1}>
          {item.title || 'Favorite Content'}
        </Text>
        <View style={styles.favoriteMeta}>
          <Icon name="heart" size={12} color="#FF6B6B" />
          <Text style={styles.favoriteMetaText}>
            {item.rating ? `${item.rating}/10` : 'Favorite'}
          </Text>
        </View>
        <Text style={styles.favoriteYear}>
          {item.year || item.releaseDate ? new Date(item.year || item.releaseDate).getFullYear() : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => Alert.alert('Remove', 'Remove from favorites?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => {
            setFavorites(prev => prev.filter((_, i) => i !== index));
          }}
        ])}
        activeOpacity={0.7}
      >
        <Icon name="heart-outline" size={22} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchFavorites} activeOpacity={0.7}>
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
        <Text style={styles.headerTitle}>My Favorites</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Icon name="options-outline" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="heart-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>Movies and shows you like will appear here</Text>
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
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item, index) => item._id || item.id || `fav-${index}`}
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
  favoriteItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  favoriteImage: { width: 80, height: 120, borderRadius: 8 },
  favoriteInfo: { flex: 1, marginLeft: 12 },
  favoriteTitle: { color: '#FFFFFF', fontSize: getFontSize(15), fontWeight: '600', marginBottom: 4 },
  favoriteMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  favoriteMetaText: { color: '#9CA3AF', fontSize: getFontSize(12) },
  favoriteYear: { color: '#6C63FF', fontSize: getFontSize(11) },
  removeButton: { padding: 8 },
});

export default FavoritesScreen;