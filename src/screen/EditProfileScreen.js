import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const getFontSize = (size) => {
  if (isTablet) return size * 1.2;
  if (isSmallPhone) return size * 0.85;
  return size;
};

const EditProfileScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobileNumber || '');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validateEmail = (text) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  };

  const validateMobile = (text) => {
    const cleaned = text.replace(/\s/g, '');
    return /^\d{10}$/.test(cleaned);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!mobile.trim() || !validateMobile(mobile)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const result = updateProfile({
        name: name.trim(),
        email: email.trim(),
        mobileNumber: mobile.replace(/\s/g, ''),
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to update profile. Please try again.');
        return;
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#0a0e27', '#1a1f4e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        <Animated.ScrollView style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} showsVerticalScrollIndicator={false}>
          <View style={styles.profileImageSection}>
            {user?.profileImage || user?.avatar ? (
              <Image source={{ uri: user.profileImage || user.avatar }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Icon name="person" size={50} color="#6C63FF" />
              </View>
            )}
            <TouchableOpacity style={styles.changePhotoButton} activeOpacity={0.7}>
              <LinearGradient colors={['#6C63FF', '#4A3FF5']} style={styles.changePhotoGradient}>
                <Icon name="camera" size={16} color="#FFFFFF" />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Icon name="person-outline" size={16} color="#6C63FF" />
                <Text style={styles.inputLabel}>Full Name</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                  selectionColor="#6C63FF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Icon name="mail-outline" size={16} color="#6C63FF" />
                <Text style={styles.inputLabel}>Email Address</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor="#6C63FF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Icon name="call-outline" size={16} color="#6C63FF" />
                <Text style={styles.inputLabel}>Mobile Number</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#6B7280"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={11}
                  selectionColor="#6C63FF"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={loading}
          >
            <LinearGradient colors={['#6C63FF', '#4A3FF5']} style={styles.saveGradient}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: isSmallPhone ? 16 : 20, paddingVertical: isSmallPhone ? 12 : 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { fontSize: isSmallPhone ? getFontSize(18) : getFontSize(22), fontWeight: 'bold', color: '#FFFFFF' },
  scrollView: { flex: 1, paddingBottom: 40 },
  profileImageSection: { alignItems: 'center', paddingVertical: 30 },
  profileImage: { width: isTablet ? 120 : 100, height: isTablet ? 120 : 100, borderRadius: isTablet ? 60 : 50, borderWidth: 3, borderColor: '#6C63FF' },
  profileImagePlaceholder: { backgroundColor: 'rgba(108,99,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  changePhotoButton: { marginTop: 12, borderRadius: 20, overflow: 'hidden' },
  changePhotoGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 6 },
  changePhotoText: { color: '#FFFFFF', fontSize: getFontSize(13), fontWeight: '600' },
  formContainer: { paddingHorizontal: isSmallPhone ? 16 : 20, gap: 20 },
  inputGroup: { gap: 6 },
  inputLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  inputLabel: { color: '#6B7280', fontSize: getFontSize(13), fontWeight: '500' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 10 },
  input: { flex: 1, color: '#FFFFFF', fontSize: getFontSize(15), paddingVertical: 0 },
  saveButton: { marginHorizontal: isSmallPhone ? 16 : 20, marginTop: 30, borderRadius: 12, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: getFontSize(16), fontWeight: '600' },
  saveButtonDisabled: { opacity: 0.6 },
  cancelButton: { marginHorizontal: isSmallPhone ? 16 : 20, marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { color: '#9CA3AF', fontSize: getFontSize(15), fontWeight: '500' },
});

export default EditProfileScreen;