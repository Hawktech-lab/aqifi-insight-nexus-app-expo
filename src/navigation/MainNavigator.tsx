import React, { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useDeviceFingerprinting } from '../contexts/DeviceFingerprintingContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { KYCScreen } from '../screens/KYCScreen';
import { WaitlistScreen } from '../screens/WaitlistScreen';
import { AuthNavigator } from './AuthNavigator';
import RealGmailAuthService from '../services/RealGmailAuthService';
import { mainStyles } from '../styles/mainStyles';

const Stack = createNativeStackNavigator();

export const MainNavigator = () => {
  const { loading, isAuthenticated } = useAuth();
  const { trackEvent, deviceFingerprint, isInitialized } = useDeviceFingerprinting();
  const navigationRef = useRef<any>(null);

  // Initialize Expo Gmail Auth Service when app starts
  useEffect(() => {
    const initializeGmailAuth = async () => {
      try {
        const gmailAuthService = RealGmailAuthService.getInstance();
        const testResult = await gmailAuthService.testConfiguration();
        if (testResult.success) {
          console.log('Expo Gmail Auth Service initialized successfully');
        } else {
          console.error('Expo Gmail Auth Service configuration failed:', testResult.error);
        }
      } catch (error) {
        console.error('Failed to initialize Expo Gmail Auth Service:', error);
      }
    };
    
    initializeGmailAuth();
  }, []);
  
  // Track app lifecycle events automatically
  useEffect(() => {
    if (isInitialized && deviceFingerprint) {
      trackEvent('app_lifecycle', {
        event: 'app_started',
        device_id: deviceFingerprint.device_id,
        os_type: deviceFingerprint.os_type,
        app_version: deviceFingerprint.app_version,
      });
    }
  }, [isInitialized, deviceFingerprint, trackEvent]);

  // Track authentication state changes
  useEffect(() => {
    if (isInitialized && deviceFingerprint) {
      trackEvent('auth_state_change', {
        is_authenticated: isAuthenticated,
        device_id: deviceFingerprint.device_id,
      });
    }
  }, [isAuthenticated, isInitialized, deviceFingerprint, trackEvent]);

  if (loading) {
    return (
      <View style={mainStyles.loadingContainer}>
        <Text style={mainStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="KYC" component={KYCScreen} />
            <Stack.Screen name="Waitlist" component={WaitlistScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

