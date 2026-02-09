import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useState, useEffect} from 'react';
import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {Icons} from '../assets';
import Home from '../screen/Home';
import {scale} from '../utils/Scalling';
import authService from '../api/auth';

// Placeholder screens
const LikesScreen = () => (
  <View style={styles.placeholderContainer}>
    <Image source={Icons.Cheart} style={styles.placeholderIcon} />
    <Text style={styles.placeholderText}>Likes</Text>
  </View>
);

const PlayingScreen = () => (
  <View style={styles.placeholderContainer}>
    <Image source={Icons.Cvector} style={styles.placeholderIcon} />
    <Text style={styles.placeholderText}>Playing</Text>
  </View>
);

const DownloadScreen = () => (
  <View style={styles.placeholderContainer}>
    <Image source={Icons.Cdownload} style={styles.placeholderIcon} />
    <Text style={styles.placeholderText}>Downloads</Text>
  </View>
);

// Profile Screen with API integration
const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from auth service
      const currentUser = authService.getCurrentUser();
      const token = currentUser?.authToken;

      if (!token) {
        // Try to get token from AsyncStorage or context
        // For now, use a fallback or show error
        throw new Error('No authentication token found');
      }

      const response = await authService.getUser(token);
      
      if (response.success) {
        setUser(response.user);
      } else {
        setError(response.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to load profile');
      
      // Set fallback user data for demo
      setUser({
        name: 'Demo User',
        email: 'demo@example.com',
        mobile: '9876543210',
        profileImage: 'https://via.placeholder.com/100',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            authService.logout();
            // Trigger logout through context - reload the app
            // In a real app, you'd update the auth context state
            Alert.alert('Logged Out', 'You have been logged out successfully.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A6BFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setShowProfileModal(true)}>
          <Icon name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={
              user?.profileImage
                ? {uri: user.profileImage}
                : Icons.Cuser
            }
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || user?.mobile || 'No email'}</Text>
          
          {user?.membership && (
            <View style={styles.membershipBadge}>
              <Icon name="diamond" size={14} color="#FFD700" />
              <Text style={styles.membershipText}>{user.membership}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.watchHistory || 0}</Text>
            <Text style={styles.statLabel}>Watched</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.favorites || 0}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.watchlist || 0}</Text>
            <Text style={styles.statLabel}>Watchlist</Text>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowProfileModal(true)}>
            <Icon name="person-outline" size={22} color="#FFFFFF" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Icon name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Subscription')}>
            <Icon name="diamond-outline" size={22} color="#FFD700" />
            <Text style={styles.menuText}>Subscription</Text>
            <Icon name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="heart-outline" size={22} color="#FFFFFF" />
            <Text style={styles.menuText}>My Favorites</Text>
            <Icon name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="download-outline" size={22} color="#FFFFFF" />
            <Text style={styles.menuText}>Downloads</Text>
            <Icon name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="time-outline" size={22} color="#FFFFFF" />
            <Text style={styles.menuText}>Watch History</Text>
            <Icon name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="notifications-outline" size={22} color="#FFFFFF" />
            <Text style={styles.menuText}>Notifications</Text>
            <Icon name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="help-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Icon name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={22} color="#FF6B6B" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalProfileImage}>
                <Image
                  source={
                    user?.profileImage
                      ? {uri: user.profileImage}
                      : Icons.Cuser
                  }
                  style={styles.modalImage}
                />
                <TouchableOpacity style={styles.changePhotoButton}>
                  <Icon name="camera" size={20} color="#4A6BFF" />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <Text style={styles.inputValue}>{user?.name || 'User'}</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <Text style={styles.inputValue}>{user?.email || 'No email'}</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mobile</Text>
                <Text style={styles.inputValue}>{user?.mobile || 'No mobile'}</Text>
              </View>

              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const Tab = createBottomTabNavigator();

export default function BottomTabNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <LinearGradient
            colors={['#1a1a1a', '#000']}
            style={styles.gradient}
          />
        ),
        tabBarIcon: ({focused}) => {
          let iconSource = Icons.home;
          if (route.name === 'Home') {
            iconSource = focused ? Icons.Chome : Icons.home;
          } else if (route.name === 'Likes') {
            iconSource = focused ? Icons.Cheart : Icons.heart;
          } else if (route.name === 'Playing') {
            iconSource = focused ? Icons.Cvector : Icons.vector;
          } else if (route.name === 'Downloads') {
            iconSource = focused ? Icons.Cdownload : Icons.download;
          } else if (route.name === 'Profile') {
            iconSource = focused ? Icons.Cuser : Icons.user;
          }

          return (
            <View style={focused ? styles.activeIconWrapper : null}>
              <Image
                source={iconSource}
                style={[styles.icon, !focused && styles.iconInactive]}
                resizeMode="contain"
              />
            </View>
          );
        },
      })}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Likes" component={LikesScreen} />
      <Tab.Screen
        name="Playing"
        component={PlayingScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <View style={styles.centerTab}>
              <Image
                source={focused ? Icons.Cvector : Icons.vector}
                style={styles.playingIcon}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen name="Downloads" component={DownloadScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Tab Bar Styles
  tabBar: {
    position: 'absolute',
    bottom: scale(0),
    left: scale(20),
    right: scale(20),
    height: scale(70),
    borderRadius: scale(30),
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  gradient: {
    flex: 1,
    borderRadius: scale(30),
  },
  icon: {
    width: scale(25),
    height: scale(25),
  },
  iconInactive: {
    tintColor: '#aaa',
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: scale(10),
    borderRadius: scale(20),
  },
  centerTab: {
    backgroundColor: '#ff4d4d',
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(30),
    shadowColor: '#ff4d4d',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playingIcon: {
    width: scale(30),
    height: scale(30),
    tintColor: '#fff',
  },
  
  // Placeholder Styles
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1E',
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    tintColor: '#666',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },

  // Profile Screen Styles
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4A6BFF',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  membershipText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#1A1A2E',
    borderBottomColor: '#1A1A2E',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  menuText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionText: {
    color: '#444',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F0F1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalBody: {
    padding: 20,
  },
  modalProfileImage: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#4A6BFF',
    marginBottom: 10,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#4A6BFF',
    fontSize: 14,
    marginLeft: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  inputValue: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
  },
  saveButton: {
    backgroundColor: '#4A6BFF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
