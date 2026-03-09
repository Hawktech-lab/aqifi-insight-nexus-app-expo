import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Aqifi',
  slug: 'aqifi-insight-nexus-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.aqifi.insightnexus',
    buildNumber: '1.0.0',
    infoPlist: {
      NSCameraUsageDescription: 'This app needs access to camera to take photos for profile and document uploads.',
      NSPhotoLibraryUsageDescription: 'This app needs access to photo library to select images for profile and document uploads.',
      NSMicrophoneUsageDescription: 'This app needs access to microphone for voice recordings.',
      NSLocationWhenInUseUsageDescription: 'This app needs access to location for location-based features.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'This app collects your location in the background to reward you for data sharing.',
      UIBackgroundModes: ['remote-notification', 'location']
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.aqifi.insightnexus',
    versionCode: 1,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.ACCESS_BACKGROUND_LOCATION'
    ]
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro'
  },
  plugins: [
    'expo-asset',
    'expo-router',
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        photosPermission: 'The app accesses your photos to let you share them with your friends.'
      }
    ],
    [
      'expo-document-picker',
      {
        iCloudContainerEnvironment: 'Production'
      }
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.'
      }
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'Allow $(PRODUCT_NAME) to access your photos.',
        savePhotosPermission: 'Allow $(PRODUCT_NAME) to save photos.',
        isAccessMediaLocationEnabled: true
      }
    ],
    // Google Sign-In plugin configuration
    // Note: These values are required at build time for native module configuration
    // The actual OAuth flow at runtime uses values from the database via AppConfigurationService
    // Set these environment variables at build time (required for native module setup):
    // - EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME (e.g., com.googleusercontent.apps.CLIENT_ID_PREFIX)
    // - EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (e.g., CLIENT_ID.apps.googleusercontent.com)
    // - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (e.g., CLIENT_ID.apps.googleusercontent.com)
    // If these are not set, the plugin will be skipped (OAuth will still work via database config at runtime)
    ...(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID && process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ? [
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || `com.googleusercontent.apps.${process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.split('.')[0]}`,
          androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
        }
      ]
    ] : [])
  ],
  scheme: 'aqifi',
  extra: {
    eas: {
      projectId: 'd18ea8df-9d8f-48b1-b4a5-0a8159055e6d'
    },
    cli: {
      appVersionSource: 'remote'
    },
    // NOTE: All sensitive configuration values are now stored in the database (app_configuration table).
    // Only Supabase connection details are loaded from environment variables (required for initial connection).
    // To update configuration, use the app_configuration table in Supabase.
    // See: database-app-config-migration.sql and src/services/AppConfigurationService.ts
    // Supabase connection details can be provided via environment variables, or will use fallback values:
    // - EXPO_PUBLIC_SUPABASE_URL (optional, falls back to hardcoded value)
    // - EXPO_PUBLIC_SUPABASE_ANON_KEY (optional, falls back to hardcoded value)
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://uyamvlctjacvevyfdnez.supabase.co",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YW12bGN0amFjdmV2eWZkbmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzE3NTQsImV4cCI6MjA2NzI0Nzc1NH0.GustXM94NZXF5oCghzHeRo9NFqRNLtnyaUQMjGCgIOg",
  },
  owner: 'hawkrelteam',
  runtimeVersion: '1.0.0',
  // Temporarily disabled updates to fix build issues
  // updates: {
  //   url: 'https://u.expo.dev/d18ea8df-9d8f-48b1-b4a5-0a8159055e6d'
  // }
});
