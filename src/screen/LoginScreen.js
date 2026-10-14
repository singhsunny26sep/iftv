import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, Typography, Spacing, BorderRadius, Shadows } from '../theme/DesignSystem';
import { scale, moderateScale, verticalScale } from '../utils/Scalling';
import authService from '../api/auth';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [shake, setShake] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const inputScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const socialSlide = useRef(new Animated.Value(50)).current;
  const socialOpacity = useRef(new Animated.Value(0)).current;
  const termsSlide = useRef(new Animated.Value(30)).current;
  const termsOpacity = useRef(new Animated.Value(0)).current;

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
      Animated.spring(socialSlide, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(socialOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(termsSlide, {
        toValue: 0,
        duration: 600,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(termsOpacity, {
        toValue: 1,
        duration: 600,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation
    const rotateLoop = Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );

    // Pulse animation for logo
    const pulseLoop = Animated.loop(
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
    );

    // Shimmer animation
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );

    rotateLoop.start();
    pulseLoop.start();
    shimmerLoop.start();

    // Native-driven loops run forever unless explicitly stopped, so leaking
    // them keeps the UI thread animating after this screen is gone.
    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(inputScale, {
      toValue: 1.02,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(inputScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const validateMobileNumber = (number) => {
    return /^\d{10}$/.test(number);
  };

  const handleSendOTP = async () => {
    if (!mobileNumber.trim()) {
      triggerShake();
      Alert.alert(
        'Hey there! 👋',
        'Please enter your mobile number to continue',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    if (!validateMobileNumber(mobileNumber.replace(/\s/g, ''))) {
      triggerShake();
      Alert.alert(
        'Invalid Number 📱',
        'Please enter a valid 10-digit mobile number',
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

    setLoading(true);
    try {
      const cleanNumber = mobileNumber.replace(/\s/g, '');
      const response = await authService.sendOTP(cleanNumber);
      navigation.navigate('OTPVerification', {
        mobileNumber: cleanNumber,
        sessionId: response.sessionId,
        fromLogin: true,
      });
    } catch (error) {
      Alert.alert('Oops! 😅', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    Animated.sequence([
      Animated.timing(inputScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputScale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => setShake(false));
  };

  const formatMobileNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const truncated = cleaned.slice(0, 10);
    const formatted = truncated.replace(/(\d{5})(\d{5})/, '$1 $2');
    setMobileNumber(formatted);
  };

  const rotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerInterpolate = shimmerAnim.interpolate({
    inputRange: [0, 0.3, 0.5, 0.7, 1],
    outputRange: [0, 0, 1, 0, 0],
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
          {/* Animated Gradient Overlay */}
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
            keyboardShouldPersistTaps="handled"
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
              {navigation.canGoBack() ? (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Icon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <View style={styles.backButton} />
              )}
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
                  <Icon name="headset-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.languageButton} activeOpacity={0.7}>
                  <Text style={styles.languageText}>EN</Text>
                  <Icon name="chevron-down" size={16} color="#FFFFFF" />
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
              
                 <Image style={styles.logoContainers} source={require("../assets/Images/logo.png")} />
              
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
              <Text style={styles.welcomeText}>
                Welcome Back! 🎬
              </Text>
              <Text style={styles.subtitleText}>
                Sign in to continue watching your favorite movies and shows
              </Text>
            </Animated.View>

            {/* Form Section */}
            <Animated.View 
              style={[
                styles.formSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <View style={styles.inputCard}>
                <View style={styles.inputContainer}>
                  <View style={styles.labelContainer}>
                    <View style={styles.labelIcon}>
                      <Icon name="call-outline" size={16} color="#6C63FF" />
                    </View>
                    <Text style={styles.label}>Mobile Number</Text>
                  </View>
                  <Animated.View 
                    style={[
                      styles.inputWrapper,
                      isFocused && styles.inputWrapperFocused,
                      mobileNumber.length > 0 && styles.inputWrapperFilled,
                      shake && styles.inputWrapperShake,
                      { transform: [{ scale: inputScale }] },
                    ]}
                  >
                    <View style={styles.countryCode}>
                      <Image 
                        source={{ uri: 'https://flagcdn.com/w20/in.png' }}
                        style={styles.flagIcon}
                      />
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      placeholder="Enter 10-digit mobile number"
                      keyboardType="phone-pad"
                      value={mobileNumber}
                      onChangeText={formatMobileNumber}
                      maxLength={11}
                      style={styles.input}
                      placeholderTextColor="#6B7280"
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      selectionColor="#6C63FF"
                    />
                    {mobileNumber.length > 0 && (
                      <TouchableOpacity 
                        onPress={() => setMobileNumber('')}
                        style={styles.clearButton}
                        activeOpacity={0.7}
                      >
                        <Icon name="close-circle" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                  <View style={styles.helperContainer}>
                    <Icon name="information-circle-outline" size={14} color="#6B7280" />
                    <Text style={styles.helperText}>
                      We'll send you a 6-digit verification code
                    </Text>
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        (!mobileNumber.trim() || loading) && styles.loginButtonDisabled,
                      ]}
                      onPress={handleSendOTP}
                      disabled={loading || !mobileNumber.trim()}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={!mobileNumber.trim() || loading 
                          ? ['#3D3D6B', '#2D2D5B'] 
                          : ['#6C63FF', '#4A3FF5']}
                        style={styles.loginGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {loading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.loginButtonText}>Sending...</Text>
                          </View>
                        ) : (
                          <>
                            <Text style={styles.loginButtonText}>Get OTP</Text>
                            <Icon name="arrow-forward" size={20} color="#FFFFFF" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                </View>

                {/* Social Login Options */}
                <Animated.View 
                  style={[
                    styles.socialSection,
                    {
                      opacity: socialOpacity,
                      transform: [{ translateY: socialSlide }],
                    }
                  ]}
                >
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <View style={styles.dividerTextContainer}>
                      <Text style={styles.dividerText}>or continue with</Text>
                    </View>
                    <View style={styles.divider} />
                  </View>
                  <View style={styles.socialButtons}>
                    {[
                      { icon: 'logo-google', color: '#DB4437', label: 'Google' },
                      { icon: 'logo-facebook', color: '#1877F2', label: 'Facebook' },
                      { icon: 'logo-apple', color: '#FFFFFF', label: 'Apple' },
                    ].map((social, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={styles.socialButton}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.socialIconContainer, { borderColor: social.color + '30' }]}>
                          <Icon name={social.icon} size={24} color={social.color} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              </View>
            </Animated.View>

            {/* Terms */}
            <Animated.View 
              style={[
                styles.termsContainer,
                {
                  opacity: termsOpacity,
                  transform: [{ translateY: termsSlide }],
                }
              ]}
            >
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
              <TouchableOpacity style={styles.helpLink}>
                <Text style={styles.helpLinkText}>Need help? Contact Support</Text>
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
    backgroundColor: '#FF6B6B',
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
    backgroundColor: '#00D2FF',
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
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  welcomeText: {
    fontSize: Typography.fontSize.hero,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: Typography.fontSize.md,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal,
    paddingHorizontal: Spacing.lg,
    maxWidth: width * 0.8,
  },
  formSection: {
    marginBottom: Spacing.xxxl,
  },
  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 28,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  labelIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: '#D1D5DB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#6C63FF',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  inputWrapperFilled: {
    borderColor: '#4A3FF5',
  },
  inputWrapperShake: {
    borderColor: '#FF6B6B',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  flagIcon: {
    width: 20,
    height: 15,
    borderRadius: 2,
  },
  countryCodeText: {
    color: '#D1D5DB',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: Typography.fontSize.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    minHeight: 55,
  },
  clearButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 6,
    paddingHorizontal: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: '#6B7280',
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
  loginButton: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 58,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loginButtonText: {
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
  socialSection: {
    marginTop: Spacing.xl,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dividerTextContainer: {
    paddingHorizontal: Spacing.md,
  },
  dividerText: {
    color: '#6B7280',
    fontSize: Typography.fontSize.xs,
    letterSpacing: 0.5,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  socialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  termsContainer: {
    marginTop: 'auto',
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  termsText: {
    fontSize: Typography.fontSize.xs,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal,
  },
  termsLink: {
    color: '#6C63FF',
    fontWeight: Typography.fontWeight.semiBold,
  },
  helpLink: {
    padding: 4,
  },
  helpLinkText: {
    fontSize: Typography.fontSize.xs,
    color: '#4A3FF5',
    textAlign: 'center',
  },
  logoContainers:{
    height: 110,
    width: 110,
    borderRadius: 35,
  }
});

export default LoginScreen;