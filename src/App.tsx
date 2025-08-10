import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/Ionicons';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DeviceFingerprintingProvider } from './contexts/DeviceFingerprintingContext';

// Screens
import Dashboard from './screens/Dashboard';
import Activity from './screens/Activity';
import Surveys from './screens/Surveys';
import Settings from './screens/Settings';
import Auth from './screens/Auth';
import Admin from './screens/Admin';

// Types for navigation
export type RootStackParamList = {
  AuthStack: undefined;
  MainTabs: undefined;
};

export type AuthStackParamList = {
  Auth: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Activity: undefined;
  Surveys: undefined;
  Settings: undefined;
  Admin: undefined;
};

const queryClient = new QueryClient();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();

// Auth Stack Navigator
const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Auth" component={Auth} />
  </AuthStack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => (
  <MainTabs.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string;

        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Activity':
            iconName = focused ? 'pulse' : 'pulse-outline';
            break;
          case 'Surveys':
            iconName = focused ? 'list' : 'list-outline';
            break;
          case 'Settings':
            iconName = focused ? 'settings' : 'settings-outline';
            break;
          case 'Admin':
            iconName = focused ? 'shield' : 'shield-outline';
            break;
          default:
            iconName = 'home-outline';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      headerShown: true,
      headerStyle: {
        backgroundColor: '#f8f9fa',
      },
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <MainTabs.Screen 
      name="Dashboard" 
      component={Dashboard}
      options={{ title: 'Dashboard' }}
    />
    <MainTabs.Screen 
      name="Activity" 
      component={Activity}
      options={{ title: 'Activity' }}
    />
    <MainTabs.Screen 
      name="Surveys" 
      component={Surveys}
      options={{ title: 'Surveys' }}
    />
    <MainTabs.Screen 
      name="Settings" 
      component={Settings}
      options={{ title: 'Settings' }}
    />
    <MainTabs.Screen 
      name="Admin" 
      component={Admin}
      options={{ title: 'Admin' }}
    />
  </MainTabs.Navigator>
);

// Root Navigator with Auth Logic
const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You might want to show a loading screen here
    return null;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        <RootStack.Screen name="AuthStack" component={AuthStackNavigator} />
      )}
    </RootStack.Navigator>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DeviceFingerprintingProvider>
          <SafeAreaProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </DeviceFingerprintingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
