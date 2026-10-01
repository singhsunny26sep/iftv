import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React, {useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Home from '../screen/Home';
import DownloadsScreen from '../screen/DownloadsScreen';
import NowPlayingScreen from '../screen/NowPlayingScreen';
import ProfileScreen from '../screen/ProfileScreen';

const {width} = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

// Design tokens
const TAB_BAR_HEIGHT = isSmallPhone ? 68 : 74;
const TAB_BAR_BOTTOM = isSmallPhone ? 10 : 14;
const TAB_BAR_MARGIN = isSmallPhone ? 14 : 20;
const TAB_BAR_RADIUS = isSmallPhone ? 24 : 28;
const ICON_SIZE = isSmallPhone ? 21 : 23;
const ICON_PILL_W = isSmallPhone ? 50 : 56;
const ICON_PILL_H = isSmallPhone ? 32 : 36;
const CENTER_DISC = isSmallPhone ? 46 : 52;

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: {active: 'home', inactive: 'home-outline'},
  Playing: {active: 'play', inactive: 'play'},
  Downloads: {active: 'download', inactive: 'download-outline'},
  Profile: {active: 'person', inactive: 'person-outline'},
};

// ---- Standard tab item (icon + label stacked cleanly) ----
const TabBarItem = ({routeName, focused, color, label}) => {
  const icons = TAB_ICONS[routeName] || TAB_ICONS.Home;

  const scale = useRef(new Animated.Value(1)).current;
  const pillOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(focused ? 1 : 0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.15 : 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(pillOpacity, {
        toValue: focused ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: focused ? -2 : 0,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(labelOpacity, {
        toValue: focused ? 1 : 0.7,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, pillOpacity, translateY, labelOpacity]);

  return (
    <View style={styles.tabItem}>
      <Animated.View
        style={[
          styles.iconPill,
          {transform: [{translateY}]},
        ]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.iconPillGlow, {opacity: pillOpacity}]}
        />
        <Animated.View style={{transform: [{scale}]}}>
          <Icon
            name={focused ? icons.active : icons.inactive}
            size={ICON_SIZE}
            color={color}
          />
        </Animated.View>
      </Animated.View>

      {/* Custom label — sits BELOW icon, never overlaps */}
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          {
            color,
            opacity: labelOpacity,
            fontWeight: focused ? '700' : '600',
          },
        ]}>
        {label}
      </Animated.Text>
    </View>
  );
};

// ---- Center play disc ----
const TabBarCenterItem = ({focused, label, color}) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(focused ? 1 : 0.7)).current;

  useEffect(() => {
    let loop;
    if (focused) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    } else {
      pulse.setValue(0);
    }
    return () => loop && loop.stop();
  }, [focused, pulse]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.08 : 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(labelOpacity, {
        toValue: focused ? 1 : 0.7,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, labelOpacity]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  return (
    <View style={styles.centerItem}>
      <View style={styles.centerDiscWrap}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.centerRing,
            {opacity: ringOpacity, transform: [{scale: ringScale}]},
          ]}
        />
        <Animated.View style={{transform: [{scale}]}}>
          <LinearGradient
            colors={['#8B82FF', '#5A4DF0']}
            style={[styles.centerDisc, focused && styles.centerDiscActive]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <Icon
              name="play"
              size={isSmallPhone ? 20 : 22}
              color="#FFFFFF"
              style={{marginLeft: 2}}
            />
          </LinearGradient>
        </Animated.View>
      </View>

      <Animated.Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          {
            color,
            opacity: labelOpacity,
            fontWeight: focused ? '700' : '600',
          },
        ]}>
        {label}
      </Animated.Text>
    </View>
  );
};

// Build the icon renderer per route
const tabBarIconFor = (routeName) =>
  function TabBarIconRenderer({focused, color}) {
    if (routeName === 'Playing') {
      return (
        <TabBarCenterItem
          focused={focused}
          color={color}
          label="Play"
        />
      );
    }
    return (
      <TabBarItem
        routeName={routeName}
        focused={focused}
        color={color}
        label={routeName === 'Home' ? 'Home' : routeName}
      />
    );
  };

const TabBarSurface = () => (
  <LinearGradient
    colors={['rgba(30,33,64,0.98)', 'rgba(14,17,42,0.98)']}
    style={styles.tabBarSurface}
    start={{x: 0, y: 0}}
    end={{x: 1, y: 1}}
  />
);

export default function BottomTabNavigation() {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.3)),
    }).start();
  }, [entrance]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // 👇 IMPORTANT: turn off default label, we render our own
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#A79BFF',
        tabBarInactiveTintColor: '#6E7391',
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: [
          styles.tabBar,
          {transform: [{translateY}]},
        ],
        tabBarBackground: TabBarSurface,
      }}
      sceneContainerStyle={styles.sceneContainer}>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{tabBarIcon: tabBarIconFor('Home')}}
      />
      <Tab.Screen
        name="Playing"
        component={NowPlayingScreen}
        options={{tabBarIcon: tabBarIconFor('Playing')}}
      />
      <Tab.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{tabBarIcon: tabBarIconFor('Downloads')}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{tabBarIcon: tabBarIconFor('Profile')}}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: TAB_BAR_BOTTOM,
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_RADIUS,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    elevation: 24,
    shadowColor: '#5A4DF0',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.35,
    shadowRadius: 22,
  },
  tabBarSurface: {
    flex: 1,
    borderRadius: TAB_BAR_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(140,130,255,0.18)',
    overflow: 'hidden',
  },
  tabBarItem: {
    paddingVertical: 0,
    // Ensure the item fills the tab bar height so our column layout works
    height: TAB_BAR_HEIGHT - 16,
    justifyContent: 'center',
  },
  sceneContainer: {
    backgroundColor: '#0a0e27',
  },

  // ---- Tab item (vertical stack: icon pill on top, label below) ----
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  iconPill: {
    alignItems: 'center',
    justifyContent: 'center',
    width: ICON_PILL_W,
    height: ICON_PILL_H,
    borderRadius: ICON_PILL_H / 2,
    marginBottom: 4,      // 👈 clean gap between pill and text
  },
  iconPillGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ICON_PILL_H / 2,
    backgroundColor: 'rgba(124,116,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(167,155,255,0.35)',
    shadowColor: '#7C74FF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  tabLabel: {
    fontSize: isSmallPhone ? 10 : 10.5,
    letterSpacing: 0.3,
    includeFontPadding: false,
    textAlign: 'center',
    // keep it tightly under the icon
    lineHeight: 13,
    marginTop: 0,
    paddingTop: 0,
  },

  // ---- Center play ----
  centerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  centerDiscWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  centerRing: {
    position: 'absolute',
    width: CENTER_DISC,
    height: CENTER_DISC,
    borderRadius: CENTER_DISC / 2,
    backgroundColor: 'rgba(124,116,255,0.55)',
  },
  centerDisc: {
    width: CENTER_DISC,
    height: CENTER_DISC,
    borderRadius: CENTER_DISC / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#5A4DF0',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.75,
    shadowRadius: 14,
    elevation: 12,
  },
  centerDiscActive: {
    borderColor: 'rgba(255,255,255,0.55)',
  },
});