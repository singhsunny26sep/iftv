import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Splash from '../screen/Splash';
import MovieDetail from '../screen/MovieDetails';
import MovieList from '../screen/MovieList';
import LoginScreen from '../screen/LoginScreen';
import OTPVerification from '../screen/OTPVerification';
import TokenConsoleScreen from '../screen/TokenConsoleScreen';
import SubscriptionScreen from '../screen/SubscriptionScreen';
import MyPlanScreen from '../screen/MyPlanScreen';
import SubscriptionHistoryScreen from '../screen/SubscriptionHistoryScreen';
import TransactionsScreen from '../screen/TransactionsScreen';
import EditProfileScreen from '../screen/EditProfileScreen';
import WatchHistoryScreen from '../screen/WatchHistoryScreen';
import FavoritesScreen from '../screen/FavoritesScreen';
import NotificationsScreen from '../screen/NotificationsScreen';
import HelpSupportScreen from '../screen/HelpSupportScreen';
import LiveStreamingScreen from '../screen/LiveStreamingScreen';
import OnboardingScreen from '../screen/OnboardingScreen';
import GalleryScreen from '../screen/GalleryScreen';
import TicketsScreen from '../screen/TicketsScreen';
import CreateTicketScreen from '../screen/CreateTicketScreen';
import TicketDetailScreen from '../screen/TicketDetailScreen';
import { useAuth } from '../contexts/AuthContext';
import BottomTabNavigation from './BottomTabNavigation';

const Stack = createNativeStackNavigator();

const tokenConsoleOptions = {
  headerShown: true,
  title: 'Token Console',
  headerStyle: { backgroundColor: '#1a1a2e' },
  headerTintColor: '#fff',
};

/**
 * Auth gate.
 *
 * The Login and OTP screens are only registered while there is NO stored
 * token, so once a session is restored from AsyncStorage those routes simply
 * do not exist in the navigator and cannot be reached — including via the
 * hardware back button.
 *
 * Changing the navigator `key` with the auth state forces a fresh stack on
 * every transition, which resets the history instead of leaving the user on
 * a screen from the previous session.
 */
function AppNavigation() {
  const { isAuthenticated, loading, onboardingRequired } = useAuth();

  // Hold on Splash until the stored session + onboarding flag have loaded.
  if (loading) {
    return <Splash />;
  }

  // A brand-new user (isFirst) lands here first and must complete onboarding
  // before the app stack is reachable.
  if (isAuthenticated && onboardingRequired) {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      key={isAuthenticated ? 'app' : 'auth'}
      screenOptions={{ headerShown: false }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={BottomTabNavigation} />
          <Stack.Screen name="MovieDetail" component={MovieDetail} />
          <Stack.Screen name="MovieList" component={MovieList} />
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyPlan"
            component={MyPlanScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SubscriptionHistory"
            component={SubscriptionHistoryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Transactions"
            component={TransactionsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WatchHistory"
            component={WatchHistoryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HelpSupport"
            component={HelpSupportScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LiveStreaming"
            component={LiveStreamingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TokenConsole"
            component={TokenConsoleScreen}
            options={tokenConsoleOptions}
          />
          <Stack.Screen
            name="Gallery"
            component={GalleryScreen}
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="Tickets"
            component={TicketsScreen}
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="CreateTicket"
            component={CreateTicketScreen}
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="TicketDetail"
            component={TicketDetailScreen}
            options={{ headerShown: false, presentation: 'card' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OTPVerification" component={OTPVerification} />
          <Stack.Screen
            name="TokenConsole"
            component={TokenConsoleScreen}
            options={tokenConsoleOptions}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <AppNavigation />
    </NavigationContainer>
  );
}