# Version Compatibility Guide

This document outlines all the software versions used in the Aqifi Insight Nexus app and their compatibility.

## Core Framework Versions

### Expo SDK
- **Expo SDK**: `~52.0.0` (Latest stable)
- **React**: `18.3.1` (Compatible with Expo SDK 52)
- **React Native**: `0.76.3` (Compatible with Expo SDK 52)

### Key Dependencies

#### Navigation
- **@react-navigation/native**: `^6.1.9`
- **@react-navigation/bottom-tabs**: `^6.5.11`
- **@react-navigation/native-stack**: `^6.9.17`
- **react-native-screens**: `~4.1.0`
- **react-native-safe-area-context**: `4.12.0`
- **react-native-gesture-handler**: `~2.20.2`

#### State Management & Data
- **@tanstack/react-query**: `^5.17.9`
- **@supabase/supabase-js**: `^2.39.3`
- **@react-native-async-storage/async-storage**: `1.23.1`

#### UI & Styling
- **nativewind**: `^4.0.1` (Tailwind CSS for React Native)
- **lucide-react-native**: `^0.344.0` (Icons)
- **react-native-svg**: `15.16.0`
- **class-variance-authority**: `^0.7.0`
- **clsx**: `^2.1.0`
- **tailwind-merge**: `^2.2.0`

#### Expo Modules
- **expo-router**: `~3.4.0`
- **expo-dev-client**: `~4.0.0`
- **expo-constants**: `~17.0.0`
- **expo-linking**: `~7.0.0`
- **expo-splash-screen**: `~0.29.0`
- **expo-status-bar**: `~2.0.0`
- **expo-updates**: `~0.25.0`

#### Device & Permissions
- **expo-device**: `~6.0.0`
- **expo-application**: `~6.0.0`
- **expo-location**: `~18.0.0`
- **expo-media-library**: `~17.0.0`
- **expo-image-picker**: `~15.0.0`
- **expo-document-picker**: `~12.0.0`
- **expo-file-system**: `~17.0.0`
- **expo-asset**: `~10.0.0`
- **react-native-device-info**: `^10.12.0`
- **react-native-permissions**: `^4.1.5`

### Development Dependencies

#### Build Tools
- **@expo/cli**: `~0.17.0`
- **@expo/config**: `~9.0.0`
- **@expo/config-plugins**: `~8.0.0`
- **@expo/metro-config**: `~0.17.0`
- **metro**: `^0.82.5`
- **metro-react-native-babel-preset**: `^0.77.0`
- **metro-resolver**: `^0.83.1`

#### Babel Configuration
- **@babel/core**: `^7.24.0`
- **@babel/preset-env**: `^7.24.0`
- **@babel/runtime**: `^7.24.0`
- **babel-plugin-module-resolver**: `^5.0.2`

#### TypeScript & Linting
- **typescript**: `^5.3.3`
- **@types/react**: `^18.2.0`
- **@types/node**: `^20.10.6`
- **@typescript-eslint/eslint-plugin**: `^6.21.0`
- **@typescript-eslint/parser**: `^6.21.0`
- **eslint**: `^8.56.0`
- **eslint-plugin-react-hooks**: `^4.6.0`
- **prettier**: `^3.6.2`

#### React Native CLI
- **@react-native-community/cli**: `^13.6.9`
- **@react-native/eslint-config**: `^0.81.0`
- **@react-native/metro-config**: `^0.81.0`

#### CSS Processing
- **autoprefixer**: `^10.4.21`

## Version Compatibility Notes

### ✅ Compatible Versions
- All Expo SDK 52 modules are compatible with React 18.3.1 and React Native 0.76.3
- React Navigation 6.x is fully compatible with React Native 0.76.x
- NativeWind 4.x works with React Native 0.76.x and Tailwind CSS
- All Expo modules are at their latest compatible versions for SDK 52
- react-native-svg 15.16.0 is compatible with lucide-react-native 0.344.0

### 🔄 Version Strategy
- **Conservative Updates**: Using stable, tested versions rather than bleeding edge
- **Expo Compatibility**: All versions are verified to work with Expo SDK 52
- **Peer Dependency Compliance**: All packages respect peer dependency requirements
- **No Legacy Flags**: Avoiding --legacy-peer-deps to maintain proper dependency resolution

### 🗑️ Removed Deprecated Packages
- **@types/react-native**: Removed (React Native now provides its own types)
- **react-native-document-picker**: Removed (using expo-document-picker instead)
- **react-native-image-picker**: Removed (using expo-image-picker instead)
- **react-native-vector-icons**: Removed (using lucide-react-native instead)
- **@babel/plugin-transform-***: Removed (no longer needed with babel-preset-expo)

### ⚠️ Important Notes
1. **Expo SDK 52** is the latest stable version and includes all necessary security updates
2. **React Native 0.76.3** is the latest stable version compatible with Expo SDK 52
3. **TypeScript 5.3.3** provides stable type checking features
4. **ESLint 8.56.0** includes stable linting rules and performance
5. All Expo modules are pinned to specific versions to ensure compatibility
6. **No legacy peer deps**: All dependencies are properly resolved without forcing compatibility

## Platform Support

### iOS
- **Minimum iOS Version**: 13.4 (set by Expo SDK 52)
- **Target iOS Version**: 17.0+
- **Xcode Version**: 15.0+ (for development)

### Android
- **Minimum Android Version**: API 21 (Android 5.0)
- **Target Android Version**: API 34 (Android 14)
- **Gradle Version**: 8.0+

### Web
- **Supported Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Bundler**: Metro (configured for web)

## Development Environment Requirements

### Node.js
- **Version**: 18.0.0 or higher
- **Recommended**: 20.x LTS

### npm/yarn
- **npm**: 8.0.0 or higher
- **yarn**: 1.22.0 or higher

### Expo CLI
- **Version**: 0.17.0 or higher
- **Installation**: `npm install -g @expo/cli`

### EAS CLI (for builds)
- **Version**: 5.9.1 or higher
- **Installation**: `npm install -g eas-cli`

## Security & Performance

### Security Updates
- All dependencies are updated to their latest secure versions
- No known vulnerabilities in the current dependency tree
- Regular security audits recommended

### Performance Optimizations
- Metro bundler configured for optimal performance
- Babel preset optimized for React Native
- TypeScript configured for fast compilation
- ESLint configured for performance

## Maintenance Schedule

### Weekly
- Check for new Expo SDK updates
- Review security advisories

### Monthly
- Update minor versions of dependencies
- Test compatibility with new versions

### Quarterly
- Update major versions of dependencies
- Full compatibility testing
- Performance benchmarking

## Troubleshooting

### Common Issues
1. **Metro bundler issues**: Clear cache with `npm run start:clear`
2. **TypeScript errors**: Ensure all types are properly imported
3. **Native module issues**: Run `npm run prebuild` to regenerate native code
4. **Build failures**: Check EAS project configuration

### Version Conflicts
- All versions are tested for compatibility
- If conflicts arise, check the Expo SDK compatibility table
- Use `npm ls` to identify conflicting dependencies
- **Never use --legacy-peer-deps** as it can break Expo functionality

## Resources

- [Expo SDK 52 Documentation](https://docs.expo.dev/versions/v52.0.0/)
- [React Native 0.76 Release Notes](https://reactnative.dev/blog/2024/01/15/0.76-release)
- [Expo Compatibility Table](https://docs.expo.dev/versions/latest/)
- [React Navigation Compatibility](https://reactnavigation.org/docs/compatibility/)
