import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const getFontSize = (size) => {
  if (isTablet) return size * 1.2;
  if (isSmallPhone) return size * 0.85;
  return size;
};

// Top colour of the screen gradient. Used for both the StatusBar fill and the
// container background so the status bar blends into the page instead of
// showing a mismatched strip (or a stale colour from a previous screen).
const PAGE_BG = '#0a0e27';

// Stats can arrive as an array of entries or a plain count depending on the API
const toCount = (value) => {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
};

const ProfileScreen = ({ navigation }) => {
  const { user, refreshUser, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Pull the freshest profile whenever the tab regains focus
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const profileData = {
    name: user?.name || user?.mobileNumber || 'User',
    email: user?.email || 'No email',
    mobile: user?.mobileNumber || 'No mobile',
    membership: user?.membership || user?.plan || 'Free',
    profileImage: user?.profileImage || user?.avatar || null,
    token: user?.token || null,
  };

  const stats = [
    { label: 'Watched', value: toCount(user?.watchHistory), icon: 'film-outline' },
    { label: 'Favorites', value: toCount(user?.favorites), icon: 'heart-outline' },
    { label: 'Watchlist', value: toCount(user?.watchlist), icon: 'bookmark-outline' },
  ];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }, [refreshUser]);

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'diamond-outline',
      label: 'Subscription',
      onPress: () => navigation.navigate('Subscription'),
    },
    {
      icon: 'heart-outline',
      label: 'My Favorites',
      onPress: () => navigation.navigate('Favorites'),
    },
    {
      icon: 'download-outline',
      label: 'Downloads',
      onPress: () => navigation.navigate('Downloads'),
    },
    {
      icon: 'time-outline',
      label: 'Watch History',
      onPress: () => navigation.navigate('WatchHistory'),
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          // The stack picks its initial route once on mount, so a manual
          // reset is needed to actually land back on Login after signing out.
          navigation
            .getRoot()
            .dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PAGE_BG} />
      <LinearGradient
        colors={['#0a0e27', '#1a1f4e']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={['#6C63FF', '#4A3FF5']} style={styles.headerIcon}>
              <Icon name="person" size={isSmallPhone ? 18 : 22} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.7}>
            <Icon name="create-outline" size={isSmallPhone ? 20 : 24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6C63FF"
              colors={['#6C63FF']}
            />
          }
        >
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              {profileData?.profileImage ? (
                <Image source={{ uri: profileData.profileImage }} style={[styles.profileImage, { borderRadius: isTablet ? 60 : 50 }]} />
              ) : (
                <View style={[styles.profileImage, { borderRadius: isTablet ? 60 : 50, backgroundColor: 'rgba(108,99,255,0.2)', justifyContent: 'center', alignItems: 'center' }]}>
                  <Icon name="person" size={isTablet ? 50 : 40} color="#6C63FF" />
                </View>
              )}
              <View style={styles.profileBadge}>
                <Icon name="camera" size={isTablet ? 16 : 14} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.userName}>{profileData?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{profileData?.email || profileData?.mobile || 'No email'}</Text>
            {profileData?.membership && (
              <View style={styles.membershipBadge}>
                <Icon name="diamond" size={16} color="#FFD700" />
                <Text style={styles.membershipText}>{profileData.membership} Member</Text>
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Icon name={stat.icon} size={isSmallPhone ? 16 : 20} color="#6C63FF" />
                </View>
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <View style={styles.menuIconContainer}>
                  <Icon name={item.icon} size={20} color="#6C63FF" />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
                <Icon name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <LinearGradient colors={['rgba(239,68,68,0.1)', 'rgba(239,68,68,0.05)']} style={styles.logoutGradient}>
              <Icon name="log-out-outline" size={22} color="#FF6B6B" />
              <Text style={styles.logoutText}>Log Out</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.versionText}>Version 1.0.0</Text>
        </Animated.ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAGE_BG },
  gradientBackground: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFFFFF', marginTop: 15, fontSize: getFontSize(16) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: isSmallPhone ? 16 : 20, paddingVertical: isSmallPhone ? 12 : 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { width: isSmallPhone ? 32 : 36, height: isSmallPhone ? 32 : 36, borderRadius: isSmallPhone ? 8 : 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerTitle: { fontSize: isSmallPhone ? getFontSize(18) : getFontSize(24), fontWeight: 'bold', color: '#FFFFFF' },
  settingsButton: { padding: 8 },
  scrollView: { flex: 1, paddingBottom: 80 },
  profileHeader: { alignItems: 'center', paddingVertical: isSmallPhone ? 20 : 30, paddingHorizontal: 20 },
  profileImageContainer: { position: 'relative', marginBottom: 15 },
  profileImage: { width: isTablet ? 120 : 100, height: isTablet ? 120 : 100, borderWidth: 3, borderColor: '#6C63FF' },
  profileBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6C63FF', width: isTablet ? 36 : 30, height: isTablet ? 36 : 30, borderRadius: isTablet ? 18 : 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0a0e27' },
  userName: { fontSize: isTablet ? getFontSize(28) : getFontSize(24), fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  userEmail: { fontSize: isTablet ? getFontSize(18) : getFontSize(14), color: '#9CA3AF', marginBottom: 10 },
  membershipBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  membershipText: { color: '#FFD700', fontSize: isSmallPhone ? getFontSize(11) : getFontSize(14), fontWeight: '600', marginLeft: 6 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingVertical: isSmallPhone ? 16 : 20, marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statItem: { alignItems: 'center', flex: 1 },
  statIconContainer: { marginBottom: 4 },
  statNumber: { fontSize: isTablet ? getFontSize(28) : getFontSize(20), fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 },
  statLabel: { fontSize: isSmallPhone ? getFontSize(10) : getFontSize(12), color: '#6B7280' },
  menuContainer: { paddingHorizontal: isSmallPhone ? 16 : 20, paddingTop: isSmallPhone ? 16 : 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: isSmallPhone ? 12 : 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  menuIconContainer: { width: isSmallPhone ? 32 : 36, height: isSmallPhone ? 32 : 36, borderRadius: isSmallPhone ? 8 : 10, backgroundColor: 'rgba(108,99,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuText: { flex: 1, color: '#FFFFFF', fontSize: isSmallPhone ? getFontSize(14) : getFontSize(16), marginLeft: 4 },
  logoutButton: { marginTop: isSmallPhone ? 20 : 30, marginHorizontal: isSmallPhone ? 16 : 20, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  logoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: isSmallPhone ? 12 : 15 },
  logoutText: { color: '#FF6B6B', fontSize: isSmallPhone ? getFontSize(14) : getFontSize(16), fontWeight: '600', marginLeft: 8 },
  versionText: { color: '#4A4A6B', fontSize: getFontSize(12), textAlign: 'center', marginTop: isSmallPhone ? 20 : 30, marginBottom: isSmallPhone ? 16 : 20 },
});

export default ProfileScreen;