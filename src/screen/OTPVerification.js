import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AppButton from '../components/Button/AppButton';
import { COLORS } from '../theme/Colors';
import { scale, moderateScale, verticalScale } from '../utils/Scalling';
import { useAuth } from '../contexts/AuthContext';
import authService from '../api/auth';

const OTPVerification = ({ navigation, route }) => {
  const { mobileNumber, sessionId, fromLogin = true } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  // Countdown timer for resend OTP
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(resendTimer => resendTimer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle OTP input change
  const handleOTPChange = (index, value) => {
    if (value.length > 1) return; // Prevent pasting multiple digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };
  // Handle backspace
  const handleBackspace = (index) => {
    if (index > 0 && !otp[index]) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };
  // Handle verify OTP
  const handleVerifyOTP = async (providedOtpCode) => {
    const otpCode = providedOtpCode || otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    setVerifying(true);
    
    try {
      const result = await login(mobileNumber, otpCode, sessionId);
      
      if (result.success) {
        Alert.alert('Success', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigation will be handled automatically by the auth state change
              // but we can also reset the navigation stack for a clean start
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.error);
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);
    setCanResend(false);
    setResendTimer(30);
    
    try {
      const response = await authService.sendOTP(mobileNumber);
      Alert.alert('Success', response.message);
    } catch (error) {
      Alert.alert('Error', error.message);
      setCanResend(true);
    } finally {
      setLoading(false);
    }
  };

  // Format mobile number for display (XXXXX XXXXX)
  const formatMobileForDisplay = (number) => {
    return number.replace(/(\d{5})(\d{5})/, '$1 $XXXXX');
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="shield-checkmark" size={scale(60)} color={COLORS.white} />
            </View>
          </View>

          {/* Title and Subtitle */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{' '}
              <Text style={styles.phoneNumber}>
                {formatMobileForDisplay(mobileNumber)}
              </Text>
            </Text>
          </View>

          {/* OTP Input Section */}
          <View style={styles.otpSection}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOTPChange(index, value)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      handleBackspace(index);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectionColor={COLORS.primory1}
                />
              ))}
            </View>

            <Text style={styles.helperText}>
              Didn't receive the code?{' '}
              {canResend ? (
                <Text 
                  style={styles.resendText} 
                  onPress={handleResendOTP}
                >
                  Resend OTP
                </Text>
              ) : (
                <Text style={styles.timerText}>
                  Resend in {resendTimer}s
                </Text>
              )}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <AppButton
              title={verifying ? "Verifying..." : "Verify & Continue"}
              onPress={() => handleVerifyOTP()}
              variant="primary"
              disabled={verifying || loading || otp.join('').length !== 6}
            />

            <TouchableOpacity 
              style={styles.changeNumberButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.changeNumberText}>
                Change Mobile Number
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  header: {
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
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
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: scale(15),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: COLORS.grey2,
    textAlign: 'center',
    lineHeight: moderateScale(24),
    paddingHorizontal: scale(10),
  },
  phoneNumber: {
    color: COLORS.primory1,
    fontWeight: 'bold',
  },
  otpSection: {
    marginBottom: verticalScale(40),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  otpInput: {
    width: scale(45),
    height: scale(55),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: scale(12),
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: COLORS.white,
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  helperText: {
    fontSize: moderateScale(14),
    color: COLORS.grey2,
    textAlign: 'center',
    marginTop: scale(10),
  },
  resendText: {
    color: COLORS.primory1,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  timerText: {
    color: COLORS.grey,
  },
  buttonContainer: {
    marginTop: verticalScale(20),
  },
  changeNumberButton: {
    marginTop: scale(15),
    padding: scale(10),
  },
  changeNumberText: {
    color: COLORS.primory1,
    fontSize: moderateScale(16),
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default OTPVerification;