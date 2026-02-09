import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function MovieList({ route, navigation }) {
  const { movies, title } = route.params;
  const [searchText, setSearchText] = useState('');
  const [filteredMovies, setFilteredMovies] = useState(movies);

  // Search functionality
  const handleSearch = (text) => {
    setSearchText(text);
    if (text) {
      const filtered = movies.filter(movie =>
        movie.title.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredMovies(filtered);
    } else {
      setFilteredMovies(movies);
    }
  };

  const navigateToDetail = (movie) => {
    navigation.navigate('MovieDetail', { movie });
  };

  const renderMovieItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.movieItem}
      onPress={() => navigateToDetail(item)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.movieImage} />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
        {item.year && (
          <Text style={styles.movieMeta}>{item.year} • {item.genre}</Text>
        )}
        {item.duration && (
          <Text style={styles.movieDuration}>{item.duration}</Text>
        )}
      </View>
      <Icon name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${title}...`}
          placeholderTextColor="#666"
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredMovies.length} {filteredMovies.length === 1 ? 'item' : 'items'} found
        </Text>
      </View>

      {/* Movies List */}
      <FlatList
        data={filteredMovies}
        renderItem={renderMovieItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-outline" size={60} color="#666" />
            <Text style={styles.emptyText}>No movies found</Text>
            <Text style={styles.emptySubText}>Try different search terms</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  resultsText: {
    color: '#666',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  movieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  movieImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 15,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  movieMeta: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  movieDuration: {
    color: '#4A6BFF',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    color: '#666',
    fontSize: 14,
  },
});