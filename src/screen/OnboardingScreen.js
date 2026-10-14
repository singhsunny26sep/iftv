import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const STEPS = [
  {
    key: 'welcome',
    title: 'Welcome to IFTV',
    text: 'Watch movies, live TV and Premium originals in one place.',
    icon: 'tv-outline',
  },
  {
    key: 'premium',
    title: 'Premium',
    text: 'Unlock paid and trending titles with a monthly or yearly plan.',
    icon: 'diamond-outline',
  },
  {
    key: 'profile',
    title: 'Your Profile',
    text: 'Your watch progress, favorites and downloads stay synced across devices.',
    icon: 'person-outline',
  },
];

const OnboardingScreen = () => {
  const { completeOnboarding } = useAuth();
  const [index, setIndex] = React.useState(0);

  const handleNext = () => {
    if (index < STEPS.length - 1) {
      setIndex(index + 1);
    } else {
      // Marking onboarding complete flips the auth gate (Navigation.js) to the
      // app stack; we don't need to navigate ourselves.
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const step = STEPS[index];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Icon name={step.icon} size={isTablet ? 96 : 80} color="#6C63FF" />
        </View>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.text}>{step.text}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <LinearGradient
          colors={['#6C63FF', '#4A3FF5']}
          style={styles.nextGradient}
        >
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>
              {index === STEPS.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconBox: {
    width: isTablet ? 160 : 140,
    height: isTablet ? 160 : 140,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: isTablet ? 28 : isSmallPhone ? 22 : 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  text: {
    color: '#9CA3AF',
    fontSize: isSmallPhone ? 14 : 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#6C63FF',
    width: 24,
  },
  nextGradient: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallPhone ? 15 : 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: isSmallPhone ? 13 : 14,
  },
});

export default OnboardingScreen;
