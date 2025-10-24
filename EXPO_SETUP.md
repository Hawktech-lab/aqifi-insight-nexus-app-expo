# Expo Setup Guide for Aqifi Insight Nexus App

This guide will help you set up and run the Aqifi Insight Nexus app using Expo for cross-platform development.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Expo CLI** (will be installed automatically)
4. **Expo Go** app on your mobile device (for testing)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Expo CLI globally (if not already installed):**
   ```bash
   npm install -g @expo/cli
   ```

## Development

### Starting the Development Server

1. **Start the Expo development server:**
   ```bash
   npm start
   # or
   expo start
   ```

2. **Alternative start commands:**
   ```bash
   # Start with dev client
   npm run start:dev
   
   # Start with cleared cache
   npm run start:clear
   ```

### Running on Different Platforms

#### iOS Simulator
```bash
npm run ios
```

#### Android Emulator
```bash
npm run android
```

#### Web Browser
```bash
npm run build:web
```

#### Physical Device
1. Install **Expo Go** from App Store (iOS) or Google Play Store (Android)
2. Scan the QR code displayed in the terminal or browser
3. The app will load on your device

## Building for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account:**
   ```bash
   eas login
   ```

3. **Configure EAS Build:**
   ```bash
   eas build:configure
   ```

4. **Build for different platforms:**

   **Android APK:**
   ```bash
   eas build --platform android --profile preview
   ```

   **Android AAB (for Play Store):**
   ```bash
   eas build --platform android --profile production
   ```

   **iOS (requires Apple Developer account):**
   ```bash
   eas build --platform ios --profile production
   ```

### Local Development Builds

1. **Prebuild the project:**
   ```bash
   npm run prebuild
   ```

2. **Run on specific platform:**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## Project Structure

```
├── expo/
│   └── AppEntry.js          # Expo entry point
├── src/
│   ├── components/          # Reusable components
│   ├── pages/              # Screen components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and external services
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility libraries
│   ├── types/              # TypeScript type definitions
│   ├── assets/             # Images, fonts, etc.
│   └── App.tsx             # Main app component
├── assets/                 # App icons and splash screens
├── app.json               # Expo configuration
├── app.config.js          # Advanced Expo configuration
├── eas.json               # EAS build configuration
├── metro.config.js        # Metro bundler configuration
├── babel.config.js        # Babel configuration
└── tsconfig.json          # TypeScript configuration
```

## Configuration Files

### app.json
Contains basic Expo configuration including:
- App name, version, and bundle identifiers
- Platform-specific settings (iOS, Android, Web)
- Permissions and capabilities
- Plugins configuration

### app.config.js
Advanced configuration with:
- Environment-specific settings
- Dynamic configuration based on build type
- Custom plugin configurations

### eas.json
EAS Build configuration with:
- Build profiles (development, preview, production)
- Platform-specific build settings
- Resource allocation for iOS builds

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Build and run for web
- `npm run prebuild` - Generate native code
- `npm run build:android` - Build Android app
- `npm run build:ios` - Build iOS app
- `npm run build:web` - Build web app
- `npm run publish` - Publish updates to Expo

## Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npm run start:clear
   ```

2. **Native dependencies not working:**
   ```bash
   npm run prebuild
   ```

3. **Build failures:**
   - Check your EAS project ID in app.config.js
   - Ensure you're logged in to Expo: `eas login`
   - Verify your Apple Developer account (for iOS builds)

### Development Tips

1. **Use Expo Go for rapid development** - No need to build native code for most development work
2. **Use development builds** for testing native modules that aren't supported in Expo Go
3. **Use production builds** for final testing and app store submission

## Environment Variables

Create a `.env` file in the root directory for environment-specific variables:

```env
EAS_PROJECT_ID=your-expo-project-id
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Next Steps

1. Update the `EAS_PROJECT_ID` in `app.config.js` with your actual Expo project ID
2. Configure your Supabase credentials in environment variables
3. Customize app icons and splash screens in the `assets/` directory
4. Test the app on different platforms using Expo Go
5. Set up EAS Build for production builds

## Support

For more information about Expo, visit:
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Community](https://forums.expo.dev/)
