import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  Share
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
const { width } = Dimensions.get('window');
export default function MovieDetail({ route, navigation }) {
  const { movie } = route.params;
  const [videoVisible, setVideoVisible] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const videoRef = useRef(null);

  const handlePlayVideo = () => {
    setVideoVisible(true);
    setIsVideoPaused(false);
  };

  const closeVideo = () => {
    setVideoVisible(false);
    setIsVideoPaused(true);
  };

  const toggleVideoPause = () => {
    setIsVideoPaused(!isVideoPaused);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${movie.title}" on IFTV HUB!`,
        url: movie.videoUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Video Player Modal
  const VideoPlayerModal = () => (
    <Modal
      animationType="slide"
      visible={videoVisible}
      statusBarTranslucent={true}
    >
      <View style={styles.videoContainer}>
        <TouchableOpacity 
          style={styles.videoCloseButton}
          onPress={closeVideo}
        >
          <Icon name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.videoPlayerContainer}
          onPress={toggleVideoPause}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            source={{ uri: movie.videoUrl }}
            style={styles.videoPlayer}
            paused={isVideoPaused}
            resizeMode="contain"
            controls={false}
            repeat={true}
          />
          
          {isVideoPaused && (
            <View style={styles.playButtonOverlay}>
              <Icon name="play-circle" size={80} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Custom Video Controls */}
        <View style={styles.videoControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={toggleVideoPause}
          >
            <Icon 
              name={isVideoPaused ? "play" : "pause"} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Movie Poster */}
        <View style={styles.posterContainer}>
          <Image source={{ uri: movie.thumbnail }} style={styles.posterImage} />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Overlay Info */}
          <View style={styles.posterOverlay}>
            <View style={styles.ratingBadge}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{movie.rating}</Text>
            </View>
          </View>
        </View>

        {/* Movie Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          
          <View style={styles.metaInfo}>
            {movie.year && <Text style={styles.metaText}>{movie.year}</Text>}
            {movie.genre && <Text style={styles.metaText}>• {movie.genre}</Text>}
            {movie.duration && <Text style={styles.metaText}>• {movie.duration}</Text>}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.playButton}
              onPress={handlePlayVideo}
            >
              <Icon name="play" size={24} color="#FFFFFF" />
              <Text style={styles.playButtonText}>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.iconButton}
              onPress={toggleFavorite}
            >
              <Icon 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#FF6B6B" : "#FFFFFF"} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.iconButton}
              onPress={handleShare}
            >
              <Icon name="share-social-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton}>
              <Icon name="download-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Synopsis */}
          <View style={styles.synopsisContainer}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.synopsisText}>
              {movie.synopsis || `Experience the thrilling adventure of "${movie.title}". ${movie.genre} film that will keep you on the edge of your seat. Don't miss this incredible story filled with action, drama, and unforgettable moments.`}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Genre:</Text>
              <Text style={styles.detailValue}>{movie.genre || 'Action, Adventure'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{movie.duration || '2h 15m'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Release Year:</Text>
              <Text style={styles.detailValue}>{movie.year || '2023'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Rating:</Text>
              <Text style={styles.detailValue}>{movie.rating}/5.0</Text>
            </View>
          </View>

          {/* Cast */}
          <View style={styles.castContainer}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.castItem}>
                <View style={styles.castImage} />
                <Text style={styles.castName}>Robert Downey Jr.</Text>
              </View>
              <View style={styles.castItem}>
                <View style={styles.castImage} />
                <Text style={styles.castName}>Chris Evans</Text>
              </View>
              <View style={styles.castItem}>
                <View style={styles.castImage} />
                <Text style={styles.castName}>Scarlett Johansson</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Video Player Modal */}
      <VideoPlayerModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
  },
  scrollView: {
    flex: 1,
  },
  posterContainer: {
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: 400,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  posterOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  infoContainer: {
    padding: 20,
  },
  movieTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metaText: {
    color: '#888',
    fontSize: 16,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A6BFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 15,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  iconButton: {
    padding: 12,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    marginRight: 12,
  },
  synopsisContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  synopsisText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
  },
  detailsContainer: {
    marginBottom: 25,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  detailLabel: {
    color: '#888',
    fontSize: 16,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  castContainer: {
    marginBottom: 30,
  },
  castItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  castImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1A1A2E',
    marginBottom: 8,
  },
  castName: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  // Video Player Styles
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  videoPlayerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
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
});