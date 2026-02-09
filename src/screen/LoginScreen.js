import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import CustomTextInput from '../components/textInput/CustomTextInput';
import AppButton from '../components/Button/AppButton';
import { COLORS } from '../theme/Colors';
import { scale, moderateScale, verticalScale } from '../utils/Scalling';
import authService from '../api/auth';

const LoginScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate mobile number (10 digits)
  const validateMobileNumber = (number) => {
    return /^\d{10}$/.test(number);
  };
  // Handle send OTP
  const handleSendOTP = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    if (!validateMobileNumber(mobileNumber.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const cleanNumber = mobileNumber.replace(/\s/g, '');
      const response = await authService.sendOTP(cleanNumber);

      // Navigate to OTP verification screen immediately after successful OTP send
      navigation.navigate('OTPVerification', {
        mobileNumber: cleanNumber,
        sessionId: response.sessionId,
        fromLogin: true
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format mobile number input (add space after 5 digits for better UX)
  const formatMobileNumber = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');

    // Limit to 10 digits
    const truncated = cleaned.slice(0, 10);

    // Format as XXXXX XXXXX
    const formatted = truncated.replace(/(\d{5})(\d{5})/, '$1 $2');

    setMobileNumber(formatted);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
     
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="phone-portrait" size={scale(60)} color={COLORS.white} />
            </View>
          </View>
          {/* Title and Subtitle */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number to receive a verification code
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <CustomTextInput
              label="Mobile Number"
              placeholder="Enter 10-digit mobile number"
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={formatMobileNumber}
              maxLength={11} // "XXXXX XXXXX" = 11 characters
              leftIcon="call-outline"
            />

            <Text style={styles.helperText}>
              We'll send you a 6-digit verification code
            </Text>
          </View>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <AppButton
              title={loading ? "Sending OTP..." : "Send OTP"}
              onPress={handleSendOTP}
              variant="primary"
              disabled={loading || !mobileNumber.trim()}
            />
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(20),
  },
  header: {
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(20),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(40),
  },
  logo: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  title: {
    fontSize: moderateScale(32),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: scale(10),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: COLORS.grey2,
    textAlign: 'center',
    lineHeight: moderateScale(24),
    paddingHorizontal: scale(20),
  },
  inputSection: {
    marginBottom: verticalScale(30),
  },
  helperText: {
    fontSize: moderateScale(14),
    color: COLORS.grey2,
    textAlign: 'center',
    marginTop: scale(10),
  },
  buttonContainer: {
    marginBottom: verticalScale(20),
  },
  termsText: {
    fontSize: moderateScale(12),
    color: COLORS.grey,
    textAlign: 'center',
    lineHeight: moderateScale(18),
    paddingHorizontal: scale(10),
  },
});

export default LoginScreen;