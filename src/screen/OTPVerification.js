import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AppButton from '../components/Button/AppButton';
import { COLORS, Typography, Spacing, BorderRadius, Shadows } from '../theme/DesignSystem';
import { scale, moderateScale, verticalScale } from '../utils/Scalling';
import { useAuth } from '../contexts/AuthContext';
import authService from '../api/auth';

const { width, height } = Dimensions.get('window');

const OTPVerification = ({ navigation, route }) => {
  const { mobileNumber, sessionId } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const [prevOtp, setPrevOtp] = useState('');
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);
  const [shake, setShake] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const otpBoxScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    // Focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 500);
  }, []);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      // Animate progress
      Animated.timing(progressAnim, {
        toValue: (30 - resendTimer) / 30,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      interval = setInterval(() => {
        setResendTimer(resendTimer => resendTimer - 1);
      }, 1000);
    } else {
      setCanResend(true);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOTPChange = useCallback((index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setPrevOtp(otp.join(''));
    setOtp(newOtp);
    
    // Animate box
    Animated.sequence([
      Animated.spring(otpBoxScale, {
        toValue: 1.1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(otpBoxScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveOtpIndex(index + 1);
    }
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  }, [otp]);

  const handleBackspace = useCallback((index) => {
    const current = otp.join('');
    const prev = prevOtp || current;
    if (current.length < prev.length || (index > 0 && !otp[index])) {
      const newOtp = [...otp];
      if (index > 0 && !otp[index]) {
        newOtp[index - 1] = '';
      } else {
        newOtp[index] = '';
      }
      setPrevOtp(current);
      setOtp(newOtp);
      const targetIndex = index > 0 && !otp[index] ? index - 1 : index;
      inputRefs.current[targetIndex]?.focus();
      setActiveOtpIndex(targetIndex);
    }
  }, [otp, prevOtp]);

  const triggerShake = () => {
    setShake(true);
    Animated.sequence([
      Animated.timing(otpBoxScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(otpBoxScale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(otpBoxScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(otpBoxScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => setShake(false));
  };

  const handleVerifyOTP = async (providedOtpCode) => {
    const otpCode = providedOtpCode || otp.join('');
    if (otpCode.length !== 6) {
      triggerShake();
      Alert.alert(
        'Incomplete Code 🔐',
        'Please enter the complete 6-digit verification code',
        [{ text: 'Got it!', style: 'default' }]
      );
      return;
    }
    
    // Button press animation
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.95,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setVerifying(true);
    try {
      const result = await login(mobileNumber, otpCode, sessionId);
      if (result.success) {
        Alert.alert(
          '🎉 Welcome!',
          'You have been successfully logged in',
          [
            {
              text: 'Continue',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              },
            },
          ]
        );
      } else {
        triggerShake();
        Alert.alert('Invalid Code ❌', result.error || 'Please enter a valid OTP');
        setOtp(['', '', '', '', '', '']);
        setPrevOtp('');
        setActiveOtpIndex(0);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      triggerShake();
      Alert.alert('Error 😅', error.message || 'Something went wrong. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setPrevOtp('');
      setActiveOtpIndex(0);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setLoading(true);
    setCanResend(false);
    setResendTimer(30);
    try {
      const response = await authService.sendOTP(mobileNumber);
      Alert.alert('📨 OTP Sent!', response.message || 'New OTP has been sent to your number');
      setOtp(['', '', '', '', '', '']);
      setPrevOtp('');
      setActiveOtpIndex(0);
      inputRefs.current[0]?.focus();
    } catch (error) {
      Alert.alert('Error 😅', error.message || 'Failed to resend OTP. Please try again.');
      setCanResend(true);
    } finally {
      setLoading(false);
    }
  };

  const formatMobileForDisplay = (number) => {
    return number.replace(/(\d{5})(\d{5})/, '$1 $2');
  };

  const rotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerInterpolate = shimmerAnim.interpolate({
    inputRange: [0, 0.3, 0.5, 0.7, 1],
    outputRange: [0, 0, 1, 0, 0],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <LinearGradient
          colors={['#0a0e27', '#1a1f4e', '#0d1233', '#0a0e27']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Shimmer Overlay */}
          <Animated.View 
            style={[
              styles.shimmerOverlay,
              {
                opacity: shimmerInterpolate,
                transform: [{ translateX: shimmerInterpolate.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-width, width],
                }) }],
              }
            ]}
          />

          {/* Floating Background Elements */}
          <View style={styles.floatingElements}>
            <Animated.View 
              style={[
                styles.floatingCircle, 
                styles.circle1,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [1, 1.1],
                      })
                    }
                  ]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.floatingCircle, 
                styles.circle2,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [1, 1.15],
                      })
                    }
                  ]
                }
              ]} 
            />
            <View style={[styles.floatingCircle, styles.circle3]} />
            <View style={[styles.floatingCircle, styles.circle4]} />
            <View style={[styles.floatingCircle, styles.circle5]} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Icon name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
                  <Icon name="headset-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Logo Section */}
            <Animated.View 
              style={[
                styles.logoSection,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <View style={styles.logoContainer}>
                <Animated.View 
                  style={[
                    styles.logoGlow,
                    {
                      transform: [{ scale: pulseAnim }],
                    }
                  ]}
                />
                <Animated.View 
                  style={[
                    styles.logo,
                    {
                      transform: [
                        { rotate: rotateInterpolate },
                        { scale: pulseAnim },
                      ],
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['#6C63FF', '#4A3FF5', '#6C63FF']}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="shield-checkmark" size={scale(50)} color="#FFFFFF" />
                  </LinearGradient>
                </Animated.View>
                <Animated.View 
                  style={[
                    styles.logoPulse,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [0.3, 0],
                      }),
                    }
                  ]}
                />
              </View>
              <Text style={styles.title}>Verify OTP 📱</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit verification code sent to{' '}
                <Text style={styles.phoneNumber}>{formatMobileForDisplay(mobileNumber)}</Text>
              </Text>
            </Animated.View>

            {/* OTP Input */}
            <Animated.View 
              style={[
                styles.otpSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <View style={styles.otpCard}>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.otpBox,
                        digit !== '' && styles.otpBoxFilled,
                        activeOtpIndex === index && styles.otpBoxActive,
                        shake && styles.otpBoxShake,
                        { transform: [{ scale: otpBoxScale }] },
                      ]}
                    >
                      <TextInput
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
                        selectionColor="#6C63FF"
                      />
                      {digit !== '' && (
                        <Animated.View style={styles.otpFill} />
                      )}
                    </Animated.View>
                  ))}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBackground}>
                    <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {canResend ? 'Ready to resend' : `${resendTimer}s remaining`}
                  </Text>
                </View>

                <View style={styles.helperContainer}>
                  <Icon name="information-circle-outline" size={16} color="#6B7280" />
                  <Text style={styles.helperText}>
                    Didn't receive the code?{' '}
                    {canResend ? (
                      <TouchableOpacity onPress={handleResendOTP} activeOpacity={0.7}>
                        <Text style={styles.resendText}>Resend OTP</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.timerText}>Resend in {resendTimer}s</Text>
                    )}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Verify Button */}
            <Animated.View 
              style={[
                styles.buttonContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: buttonScale }],
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (verifying || loading || otp.join('').length !== 6) && styles.verifyButtonDisabled,
                ]}
                onPress={() => handleVerifyOTP()}
                disabled={verifying || loading || otp.join('').length !== 6}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={verifying || loading || otp.join('').length !== 6
                    ? ['#3D3D6B', '#2D2D5B'] 
                    : ['#6C63FF', '#4A3FF5']}
                  style={styles.verifyGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {verifying ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.verifyButtonText}>Verifying...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.verifyButtonText}>Verify & Continue</Text>
                      <Icon name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Change Number */}
            <Animated.View 
              style={[
                styles.changeNumberContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.changeNumberButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <View style={styles.changeNumberIcon}>
                  <Icon name="arrow-back" size={18} color="#6C63FF" />
                </View>
                <Text style={styles.changeNumberText}>Change Mobile Number</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    width: width * 2,
    height: height,
    backgroundColor: 'rgba(255,255,255,0.02)',
    transform: [{ skewX: '-20deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: Spacing.xxl,
  },
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  circle1: {
    width: width * 0.9,
    height: width * 0.9,
    backgroundColor: '#6C63FF',
    top: -width * 0.4,
    right: -width * 0.2,
  },
  circle2: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: '#4A3FF5',
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  circle3: {
    width: width * 0.4,
    height: width * 0.4,
    backgroundColor: '#00D2FF',
    top: height * 0.4,
    left: -width * 0.2,
  },
  circle4: {
    width: width * 0.3,
    height: width * 0.3,
    backgroundColor: '#FFD93D',
    bottom: height * 0.3,
    right: -width * 0.1,
  },
  circle5: {
    width: width * 0.2,
    height: width * 0.2,
    backgroundColor: '#FF6B6B',
    top: height * 0.15,
    right: width * 0.1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.md,
  },
  logoContainer: {
    marginBottom: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 35,
    overflow: 'hidden',
    ...Shadows.glow,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 25,
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPulse: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  title: {
    fontSize: Typography.fontSize.hero,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal,
    paddingHorizontal: Spacing.lg,
    maxWidth: width * 0.8,
  },
  phoneNumber: {
    color: '#6C63FF',
    fontWeight: Typography.fontWeight.semiBold,
  },
  otpSection: {
    marginBottom: Spacing.xxxl,
  },
  otpCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 28,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
    gap: 10,
  },
  otpBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  otpBoxFilled: {
    borderColor: '#6C63FF',
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  otpBoxActive: {
    borderColor: '#6C63FF',
    borderWidth: 2.5,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  otpBoxShake: {
    borderColor: '#FF6B6B',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    color: '#FFFFFF',
    fontSize: moderateScale(22),
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    padding: 0,
  
  
  },
  otpFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#6C63FF',
    borderRadius: 2,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressBackground: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: '#6B7280',
    textAlign: 'center',
  },
  resendText: {
    color: '#6C63FF',
    fontWeight: Typography.fontWeight.semiBold,
  },
  timerText: {
    color: '#6B7280',
  },
  buttonContainer: {
    marginBottom: Spacing.xl,
  },
  verifyButton: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 58,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  changeNumberContainer: {
    marginTop: 'auto',
    paddingVertical: Spacing.md,
  },
  changeNumberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 10,
  },
  changeNumberIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeNumberText: {
    fontSize: Typography.fontSize.md,
    color: '#9CA3AF',
    fontWeight: Typography.fontWeight.medium,
  },
});

export default OTPVerification;