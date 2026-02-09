import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  Animated, 
  Easing,
  Dimensions 
} from 'react-native'
import React, { useEffect, useRef } from 'react'

const { width, height } = Dimensions.get('window')

export default function Splash() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const rotateAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      // Scale animation
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      // Slide up animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      // Rotate animation for loader
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.linear
        })
      )
    ]).start()
  }, [])

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  })

  return (
    <View style={styles.container}>
      {/* Background Gradient Effect */}
      <View style={styles.background}>
        <View style={styles.gradientOverlay} />
        
        {/* Animated Background Elements */}
        <Animated.View style={[styles.circle1, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.circle2, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.circle3, { opacity: fadeAnim }]} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <Animated.View style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>IFTV</Text>
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.View style={[
          styles.titleContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.appName}>CINEMA HUB</Text>
          <Text style={styles.tagline}>Unlimited Entertainment</Text>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View style={[
          styles.loaderContainer,
          {
            opacity: fadeAnim,
            transform: [{ rotate: rotateInterpolate }]
          }
        ]}>
          <View style={styles.loader} />
        </Animated.View>

        {/* Footer Text */}
        <Animated.View style={[
          styles.footer,
          { opacity: fadeAnim }
        ]}>
          <Text style={styles.footerText}>Loading your experience...</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F0F1E',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: 'linear-gradient(135deg, #0F0F1E 0%, #1A1A2E 50%, #16213E 100%)',
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(74, 107, 255, 0.1)',
    top: -100,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 74, 158, 0.08)',
    bottom: -50,
    left: -50,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(74, 222, 255, 0.06)',
    top: '40%',
    right: '20%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'linear-gradient(135deg, #4A6BFF 0%, #FF4A9E 100%)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A6BFF',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 8,
    textShadowColor: 'rgba(74, 107, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  loaderContainer: {
    marginBottom: 40,
  },
  loader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#4A6BFF',
    borderRightColor: '#FF4A9E',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  version: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
})