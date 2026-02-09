import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import { COLORS } from '../theme/Colors';
import { scale, moderateScale, verticalScale } from '../utils/Scalling';
import { useAuth } from '../contexts/AuthContext';

const TokenConsoleScreen = ({ navigation }) => {
  const { user, refreshUser, logout } = useAuth();

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Token copied to clipboard');
  };

  const handleRefreshToken = async () => {
    try {
      await refreshUser();
      Alert.alert('Success', 'Token refreshed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh token');
    }
  };

  const handleLogout = async () => {
    await logout();
    Alert.alert('Logged out', 'You have been logged out successfully');
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Token Console</Text>
        </View>

        {/* Token Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="key-outline" size={24} color={COLORS.white} />
            <Text style={styles.cardTitle}>Authentication Token</Text>
          </View>

          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>Current Token:</Text>
            <TouchableOpacity
              style={styles.tokenValueContainer}
              onPress={() => copyToClipboard(user?.token || 'No token')}
            >
              <Text style={styles.tokenValue}>
                {user?.token ? (
                  `${user.token.substring(0, 20)}...${user.token.substring(user.token.length - 20)}`
                ) : (
                  'No token available'
                )}
              </Text>
              <Icon name="copy-outline" size={16} color={COLORS.grey} />
            </TouchableOpacity>
          </View>

          <View style={styles.copyHint}>
            <Icon name="information-circle-outline" size={14} color={COLORS.grey} />
            <Text style={styles.copyHintText}>Tap on token to copy</Text>
          </View>
        </View>

        {/* User Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="person-outline" size={24} color={COLORS.white} />
            <Text style={styles.cardTitle}>User Details</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile Number:</Text>
            <Text style={styles.detailValue}>{user?.mobileNumber || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Login Time:</Text>
            <Text style={styles.detailValue}>
              {user?.loginTime
                ? new Date(user.loginTime).toLocaleString()
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auth Status:</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {user?.token ? 'Authenticated' : 'Not Authenticated'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="settings-outline" size={24} color={COLORS.white} />
            <Text style={styles.cardTitle}>Actions</Text>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleRefreshToken}>
            <Icon name="refresh-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Refresh Token</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Icon name="log-out-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Info */}
        <View style={styles.debugCard}>
          <View style={styles.cardHeader}>
            <Icon name="bug-outline" size={24} color={COLORS.orange} />
            <Text style={[styles.cardTitle, { color: COLORS.orange }]}>
              Debug Information
            </Text>
          </View>

          <Text style={styles.debugText}>
            Token Length: {user?.token?.length || 0} characters
          </Text>
          <Text style={styles.debugText}>
            Token Prefix: {user?.token?.substring(0, 10) || 'N/A'}...
          </Text>
          <Text style={styles.debugText}>
            User ID: {user?.id || user?._id || 'N/A'}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(30),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  cardTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: scale(12),
  },
  tokenContainer: {
    marginBottom: verticalScale(12),
  },
  tokenLabel: {
    fontSize: moderateScale(14),
    color: COLORS.grey2,
    marginBottom: verticalScale(8),
  },
  tokenValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  tokenValue: {
    fontSize: moderateScale(12),
    color: COLORS.white,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: scale(10),
  },
  copyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyHintText: {
    fontSize: moderateScale(12),
    color: COLORS.grey,
    marginLeft: scale(6),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailLabel: {
    fontSize: moderateScale(14),
    color: COLORS.grey2,
  },
  detailValue: {
    fontSize: moderateScale(14),
    color: COLORS.white,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  statusText: {
    fontSize: moderateScale(12),
    color: COLORS.white,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(10),
  },
  actionButtonText: {
    fontSize: moderateScale(16),
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: scale(10),
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  debugCard: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  debugText: {
    fontSize: moderateScale(12),
    color: COLORS.grey,
    marginTop: verticalScale(6),
    fontFamily: 'monospace',
  },
});

export default TokenConsoleScreen;
