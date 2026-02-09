import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import Splash from '../screen/Splash';
import MovieDetail from '../screen/MovieDetails';
import MovieList from '../screen/MovieList';
import LoginScreen from '../screen/LoginScreen';
import OTPVerification from '../screen/OTPVerification';
import TokenConsoleScreen from '../screen/TokenConsoleScreen';
import SubscriptionScreen from '../screen/SubscriptionScreen';
import { useAuth } from '../contexts/AuthContext';
import BottomTabNavigation from './BottomTabNavigation';

const Stack = createNativeStackNavigator();

// Main navigation component that uses auth context
function AppNavigation() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return null;
  }
  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Main" : "Login"}
      screenOptions={{headerShown: false}}>
      {/* Authentication Screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerification} />
      
      {/* Main App Screens with Bottom Tabs */}
      <Stack.Screen name="Main" component={BottomTabNavigation} />
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="MovieDetail" component={MovieDetail} />
      <Stack.Screen name="MovieList" component={MovieList} />
      <Stack.Screen 
        name="TokenConsole" 
        component={TokenConsoleScreen} 
        options={{headerShown: true, title: 'Token Console', headerStyle: {backgroundColor: '#1a1a2e'}, headerTintColor: '#fff'}}
      />
    <Stack.Screen 
        name="Subscription" 
        component={SubscriptionScreen} 
        options={{headerShown: false}}
      />
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
