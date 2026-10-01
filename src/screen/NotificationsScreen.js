import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const getFontSize = (size) => {
  if (isTablet) return size * 1.2;
  if (isSmallPhone) return size * 0.85;
  return size;
};

const notificationsData = [
  { id: '1', title: 'New Movie Added', body: 'Check out the latest action movie now streaming on IFTV', date: '2 hours ago', read: false, type: 'content' },
  { id: '2', title: 'Subscription Renewal', body: 'Your Premium subscription will renew on Oct 1, 2026', date: '1 day ago', read: false, type: 'subscription' },
  { id: '3', title: 'Watch Party Invite', body: 'Your friend has invited you to a watch party', date: '2 days ago', read: true, type: 'social' },
  { id: '4', title: 'New Feature: Downloads', body: 'Now you can download movies and watch offline', date: '3 days ago', read: true, type: 'feature' },
  { id: '5', title: 'Weekly Recommendations', body: 'We have picked 10 shows based on your watch history', date: '5 days ago', read: true, type: 'content' },
  { id: '6', title: 'Price Update', body: 'Subscription plans have been updated with new pricing', date: '1 week ago', read: true, type: 'subscription' },
  { id: '7', title: 'Bug Fix & Improvements', body: 'App v1.0.1 is now available with performance improvements', date: '1 week ago', read: true, type: 'feature' },
  { id: '8', title: 'Welcome to IFTV', body: 'Thank you for joining us. Start your entertainment journey!', date: '2 weeks ago', read: true, type: 'general' },
];

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Notifications are currently served from local seed data. Swap this for
    // a real API call once the notifications endpoint is available.
    setLoading(true);
    setNotifications(notificationsData);
    setLoading(false);
  }, []);

  const handleNotificationPress = (notification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    Alert.alert('Done', 'All notifications marked as read');
  };

  const clearAllNotifications = () => {
    Alert.alert('Clear All', 'Are you sure you want to clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setNotifications([]);
          Alert.alert('Cleared', 'All notifications cleared');
        },
      },
    ]);
  };

  const getIconForType = (type, read) => {
    const color = read ? '#6B7280' : '#6C63FF';
    switch (type) {
      case 'content':
        return <Icon name="film-outline" size={20} color={color} />;
      case 'subscription':
        return <Icon name="diamond-outline" size={20} color={color} />;
      case 'social':
        return <Icon name="people-outline" size={20} color={color} />;
      case 'feature':
        return <Icon name="star-outline" size={20} color={color} />;
      default:
        return <Icon name="notifications-outline" size={20} color={color} />;
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.notificationItemUnread]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIconContainer}>
        {getIconForType(item.type, item.read)}
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.read && styles.notificationTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.notificationDate}>{item.date}</Text>
        </View>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
          <Text style={styles.markAllText}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="notifications-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>You are all caught up!</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearAllNotifications} activeOpacity={0.7}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
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
  markAllText: { color: '#6C63FF', fontSize: getFontSize(13), fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#9CA3AF', marginTop: 12, fontSize: getFontSize(15) },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: getFontSize(22), fontWeight: 'bold', color: '#FFFFFF', marginTop: 16 },
  emptyText: { fontSize: getFontSize(14), color: '#6B7280', marginTop: 8, textAlign: 'center', marginBottom: 24 },
  clearButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  clearButtonText: { color: '#9CA3AF', fontSize: getFontSize(14) },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  notificationItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  notificationItemUnread: { borderColor: 'rgba(108,99,255,0.2)', backgroundColor: 'rgba(108,99,255,0.05)' },
  notificationIconContainer: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  unreadDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#6C63FF' },
  notificationContent: { flex: 1 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notificationTitle: { fontSize: getFontSize(14), fontWeight: '600', color: '#FFFFFF' },
  notificationTitleUnread: { color: '#6C63FF' },
  notificationDate: { fontSize: getFontSize(11), color: '#6B7280' },
  notificationBody: { fontSize: getFontSize(13), color: '#9CA3AF', lineHeight: 18 },
});

export default NotificationsScreen;