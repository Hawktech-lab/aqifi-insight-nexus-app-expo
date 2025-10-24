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
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: 'com.googleusercontent.apps.364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj',
        androidClientId: '364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj.apps.googleusercontent.com',
        webClientId: '364847480072-sa8abl7jbo0nisdh5vt2sregmiksgsvs.apps.googleusercontent.com'
      }
    ]
  ],
  scheme: 'aqifi',
  extra: {
    eas: {
      projectId: 'd18ea8df-9d8f-48b1-b4a5-0a8159055e6d'
    },
    cli: {
      appVersionSource: 'remote'
    },
    supabaseUrl: "https://uyamvlctjacvevyfdnez.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YW12bGN0amFjdmV2eWZkbmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NzE3NTQsImV4cCI6MjA2NzI0Nzc1NH0.GustXM94NZXF5oCghzHeRo9NFqRNLtnyaUQMjGCgIOg",
    googleClientId: "364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj.apps.googleusercontent.com",
    gmailApiKey: "AIzaSyA0mIQdqC2HFih2zRhR9NI8VK6RLD3TV-A",
    // Google Services configuration for Expo
    googleServices: {
      android: {
        clientId: "364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj.apps.googleusercontent.com" // Android Client ID
      },
      ios: {
        clientId: "364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj.apps.googleusercontent.com" // iOS Client ID (same as Android for now)
      },
      web: {
        clientId: "364847480072-sa8abl7jbo0nisdh5vt2sregmiksgsvs.apps.googleusercontent.com" // Web Client ID for React Native
      }
    }
  },
  owner: 'hawkrelteam',
  runtimeVersion: '1.0.0'
  // Temporarily disabled updates to fix build issues
  // updates: {
  //   url: 'https://u.expo.dev/d18ea8df-9d8f-48b1-b4a5-0a8159055e6d'
  // }
});
