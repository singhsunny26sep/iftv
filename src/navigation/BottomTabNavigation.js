import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../utils/Scalling';
import Home from '../screen/Home';
import DownloadsScreen from '../screen/DownloadsScreen';
import NowPlayingScreen from '../screen/NowPlayingScreen';
import ProfileScreen from '../screen/ProfileScreen';

const {width: SCREEN_W} = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isSmall = SCREEN_W < 360;

// ---------- Responsive tokens ----------
const TAB_BAR_HEIGHT = moderateScale(isSmall ? 66 : 74);
const TAB_BAR_BOTTOM = isIOS ? moderateScale(26) : moderateScale(16);
const TAB_BAR_HORIZONTAL = moderateScale(isSmall ? 14 : 20);
const TAB_BAR_RADIUS = moderateScale(28);
const ICON_SIZE = moderateScale(isSmall ? 20 : 22);
const CENTER_DISC = moderateScale(isSmall ? 60 : 68);
const CENTER_LIFT = moderateScale(isSmall ? 30 : 36);
const NOTCH_RADIUS = moderateScale(38);

const Tab = createBottomTabNavigator();

const TAB_ACTIVE_COLORS = {
  Home: '#8B7FFF',
  Playing: '#FF5E7E',
  Downloads: '#3DD9C4',
  Profile: '#FFC93D',
};

const TAB_GRADIENTS = {
  Home: ['#8B7FFF', '#5B4BFF'],
  Playing: ['#FF5E7E', '#C13B5B'],
  Downloads: ['#3DD9C4', '#1BA89A'],
  Profile: ['#FFC93D', '#E09B00'],
};

const TAB_ICONS = {
  Home: {active: 'home', inactive: 'home-outline'},
  Playing: {active: 'musical-notes', inactive: 'musical-notes-outline'},
  Downloads: {active: 'cloud-download', inactive: 'cloud-download-outline'},
  Profile: {active: 'person', inactive: 'person-outline'},
};

// ============================================================
// 🌈 Animated Gradient Border (moving shine)
// ============================================================
const AnimatedGradientBorder = ({children}) => {
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shine, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shine]);

  const translateX = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View style={styles.gradientBorderWrap}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[styles.shineOverlay, {transform: [{translateX}]}]}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.35)',
            'rgba(255,255,255,0)',
          ]}
          style={StyleSheet.absoluteFill}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
        />
      </Animated.View>
    </View>
  );
};

// ============================================================
// 🔮 Orbital Particles around Active Tab
// ============================================================
const OrbitalParticles = ({color, active}) => {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, rotate]);

  if (!active) return null;

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.orbitalWrap, {transform: [{rotate: spin}]}]}>
      <View style={[styles.particle, {backgroundColor: color, top: 0}]} />
      <View
        style={[
          styles.particle,
          {backgroundColor: color, bottom: 0, opacity: 0.6},
        ]}
      />
    </Animated.View>
  );
};

// ============================================================
// 💎 UNIQUE Tab Item — Diamond indicator + Icon flip
// ============================================================
const TabBarItem = ({routeName, focused, color, label}) => {
  const icons = TAB_ICONS[routeName] || TAB_ICONS.Home;
  const gradient = TAB_GRADIENTS[routeName] || TAB_GRADIENTS.Home;

  const scale = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const flip = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const diamondScale = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const diamondRotate = useRef(new Animated.Value(0)).current;
  const labelSlide = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      // Icon bounce on active
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: focused ? 1 : 0,
          duration: 250,
          easing: Easing.out(Easing.back(3)),
          useNativeDriver: true,
        }),
      ]),
      // Flip icon
      Animated.spring(flip, {
        toValue: focused ? 1 : 0,
        friction: 8,
        tension: 90,
        useNativeDriver: true,
      }),
      // Diamond indicator
      Animated.spring(diamondScale, {
        toValue: focused ? 1 : 0,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      // Label slide
      Animated.spring(labelSlide, {
        toValue: focused ? 1 : 0,
        friction: 8,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous diamond rotation
    if (focused) {
      const loop = Animated.loop(
        Animated.timing(diamondRotate, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    } else {
      diamondRotate.setValue(0);
    }
  }, [focused, bounce, flip, diamondScale, labelSlide, diamondRotate]);

  const iconTranslateY = bounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -8, -4],
  });

  const diamondSpin = diamondRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const labelTranslateY = labelSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 0],
  });

  return (
    <View style={styles.tabItem}>
      {/* Orbital particles for active */}
      <OrbitalParticles color={color} active={focused} />

      {/* Content wrapper */}
      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: [
            {translateY: iconTranslateY},
            {scale},
          ],
        }}>
        {/* Icon */}
        <View style={styles.iconHolder}>
          <Icon
            name={focused ? icons.active : icons.inactive}
            size={ICON_SIZE}
            color={focused ? color : '#6E7391'}
          />

          {/* Diamond indicator below icon */}
          <Animated.View
            style={[
              styles.diamond,
              {
                transform: [
                  {rotate: '45deg'},
                  {scale: diamondScale},
                ],
              },
            ]}>
            <Animated.View
              style={[
                styles.diamondInner,
                {
                  backgroundColor: color,
                  transform: [{rotate: diamondSpin}],
                },
              ]}
            />
          </Animated.View>
        </View>

        {/* Label — only shows when active */}
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            {
              color,
              opacity: labelSlide,
              transform: [{translateY: labelTranslateY}],
            },
          ]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

// ============================================================
// 🎵 ULTRA UNIQUE Center — Pulsing Orb with Rings
// ============================================================
const TabBarCenterItem = ({focused, color}) => {
  const gradient = TAB_GRADIENTS.Playing;

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous rotation of outer ring
    const rotLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    rotLoop.start();

    // Dual pulse rings
    const pulseLoop1 = Animated.loop(
      Animated.timing(pulse1, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    const pulseLoop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(pulse2, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    if (focused) {
      pulseLoop1.start();
      pulseLoop2.start();
    }

    return () => {
      rotLoop.stop();
      pulseLoop1.stop();
      pulseLoop2.stop();
      pulse1.setValue(0);
      pulse2.setValue(0);
    };
  }, [focused, pulse1, pulse2, rotate]);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.12 : 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulse1Scale = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });
  const pulse1Opacity = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });
  const pulse2Scale = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });
  const pulse2Opacity = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={styles.centerItem}>
      <View style={styles.centerDiscWrap}>
        {/* Dual pulse rings */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.centerPulse,
            {
              opacity: pulse1Opacity,
              transform: [{scale: pulse1Scale}],
              borderColor: color,
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.centerPulse,
            {
              opacity: pulse2Opacity,
              transform: [{scale: pulse2Scale}],
              borderColor: color,
            },
          ]}
        />

        {/* Rotating dashed ring */}
        <Animated.View
          style={[
            styles.dashedRing,
            {transform: [{rotate: spin}]},
          ]}>
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.dash,
                {
                  backgroundColor: color,
                  transform: [
                    {rotate: `${i * 45}deg`},
                    {translateY: -moderateScale(38)},
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Main center disc with gradient border */}
        <Animated.View style={{transform: [{scale}]}}>
          <LinearGradient
            colors={gradient}
            style={styles.centerOuterGlow}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <View style={styles.centerDiscInner}>
              <LinearGradient
                colors={['#1a1428', '#0d0818']}
                style={styles.centerDiscCore}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                <LinearGradient
                  colors={gradient}
                  style={styles.playIconCircle}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}>
                  <Icon
                    name={focused ? 'pause' : 'play'}
                    size={moderateScale(isSmall ? 20 : 22)}
                    color="#FFFFFF"
                    style={{marginLeft: focused ? 0 : 3}}
                  />
                </LinearGradient>
              </LinearGradient>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
};

// ============================================================
const tabBarIconFor = (routeName) =>
  function TabBarIconRenderer({focused, color}) {
    if (routeName === 'Playing') {
      return <TabBarCenterItem focused={focused} color={color} />;
    }
    return (
      <TabBarItem
        routeName={routeName}
        focused={focused}
        color={color}
        label={routeName}
      />
    );
  };

// ============================================================
// Tab Bar Background with animated gradient border
// ============================================================
const TabBarSurface = () => (
  <AnimatedGradientBorder>
    <LinearGradient
      colors={['rgba(28,22,52,0.97)', 'rgba(12,8,28,0.99)']}
      style={styles.tabBarSurface}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
    />
  </AnimatedGradientBorder>
);

// ============================================================
export default function BottomTabNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#A79BFF',
        tabBarInactiveTintColor: '#6E7391',
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: styles.tabBar,
        tabBarBackground: TabBarSurface,
      }}
      sceneContainerStyle={styles.sceneContainer}>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: tabBarIconFor('Home'),
          tabBarActiveTintColor: TAB_ACTIVE_COLORS.Home,
        }}
      />
      <Tab.Screen
        name="Playing"
        component={NowPlayingScreen}
        options={{tabBarIcon: tabBarIconFor('Playing')}}
      />
      <Tab.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{
          tabBarIcon: tabBarIconFor('Downloads'),
          tabBarActiveTintColor: TAB_ACTIVE_COLORS.Downloads,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: tabBarIconFor('Profile'),
          tabBarActiveTintColor: TAB_ACTIVE_COLORS.Profile,
        }}
      />
    </Tab.Navigator>
  );
}

// ============================================================
const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: TAB_BAR_BOTTOM,
    left: TAB_BAR_HORIZONTAL,
    right: TAB_BAR_HORIZONTAL,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_RADIUS,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 22,
    shadowColor: '#8B7FFF',
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.45,
    shadowRadius: 28,
    overflow: 'visible',
  },
  gradientBorderWrap: {
    flex: 1,
    borderRadius: TAB_BAR_RADIUS,
    overflow: 'hidden',
  },
  tabBarSurface: {
    flex: 1,
    borderRadius: TAB_BAR_RADIUS,
    borderWidth: 1.2,
    borderColor: 'rgba(140,130,255,0.28)',
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  tabBarItem: {
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    paddingVertical: 0,
  },
  sceneContainer: {
    backgroundColor: '#0a0e27',
  },

  // ----- Tab item -----
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconHolder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(34),
  },
  diamond: {
    position: 'absolute',
    bottom: -moderateScale(6),
    width: moderateScale(10),
    height: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  diamondInner: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(2),
  },
  tabLabel: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlign: 'center',
    marginTop: moderateScale(8),
  },

  // ----- Orbital particles -----
  orbitalWrap: {
    position: 'absolute',
    width: moderateScale(50),
    height: moderateScale(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    shadowColor: '#fff',
    shadowOpacity: 1,
    shadowRadius: 4,
  },

  // ----- Center orb -----
  centerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerDiscWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -CENTER_LIFT,
  },
  centerPulse: {
    position: 'absolute',
    width: CENTER_DISC,
    height: CENTER_DISC,
    borderRadius: CENTER_DISC / 2,
    borderWidth: 2,
  },
  dashedRing: {
    position: 'absolute',
    width: moderateScale(80),
    height: moderateScale(80),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dash: {
    position: 'absolute',
    width: moderateScale(3),
    height: moderateScale(8),
    borderRadius: moderateScale(1.5),
  },
  centerOuterGlow: {
    width: CENTER_DISC + moderateScale(6),
    height: CENTER_DISC + moderateScale(6),
    borderRadius: (CENTER_DISC + moderateScale(6)) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(3),
    shadowColor: '#FF5E7E',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.9,
    shadowRadius: 22,
    elevation: 16,
  },
  centerDiscInner: {
    flex: 1,
    width: '100%',
    borderRadius: CENTER_DISC / 2,
    backgroundColor: '#0a0e27',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(4),
  },
  centerDiscCore: {
    flex: 1,
    width: '100%',
    borderRadius: CENTER_DISC / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircle: {
    width: moderateScale(isSmall ? 34 : 38),
    height: moderateScale(isSmall ? 34 : 38),
    borderRadius: moderateScale(isSmall ? 17 : 19),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});