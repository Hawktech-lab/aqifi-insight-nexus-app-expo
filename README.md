# AQIFI Insight Nexus App

A React Native application with a comprehensive UI component library converted from React web components.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install React Native dependencies:**
   ```bash
   npm install react-native react-native-reanimated react-native-gesture-handler react-native-svg react-native-vector-icons react-native-safe-area-context react-native-screens
   ```

3. **Install navigation dependencies:**
   ```bash
   npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
   ```

4. **Install styling dependencies:**
   ```bash
   npm install nativewind tailwind-merge class-variance-authority
   ```

5. **Install icon dependencies:**
   ```bash
   npm install lucide-react-native expo-status-bar
   ```

6. **Install development dependencies:**
   ```bash
   npm install --save-dev @babel/core @babel/preset-env @babel/runtime @react-native/metro-config @types/react-native metro-react-native-babel-preset
   ```

### iOS Setup (macOS only)

1. **Install iOS dependencies:**
   ```bash
   cd ios && pod install && cd ..
   ```

2. **Run on iOS:**
   ```bash
   npm run ios
   ```

### Android Setup

1. **Start Android emulator or connect device**

2. **Run on Android:**
   ```bash
   npm run android
   ```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # Converted React Native UI components
│   └── ...           # Other components
├── lib/
│   ├── utils.ts      # Utility functions
│   └── nativewind-setup.ts  # NativeWind configuration
├── screens/          # App screens
└── App.tsx          # Main app component
```

## 🔧 Configuration Files

- `metro.config.js` - Metro bundler configuration
- `babel.config.js` - Babel configuration with React Native presets
- `tailwind.config.js` - Tailwind CSS configuration for NativeWind
- `tsconfig.json` - TypeScript configuration
- `react-native.config.js` - React Native configuration for native dependencies
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration

## 🎨 UI Components

All 49 UI components have been converted from React web to React Native:

### Core Components
- Button, Input, Card, Label, Textarea, Badge, Separator, Progress
- Avatar, Alert, Alert Dialog, Accordion, Breadcrumb
- Calendar, Carousel, Chart, Collapsible, Command

### Form Components
- Checkbox, Switch, Radio Group, Select, Slider, Input OTP

### Navigation Components
- Tabs, Navigation Menu, Menubar

### Layout Components
- Dialog, Popover, Sheet, Sidebar

### Feedback Components
- Toast, Toaster, Sonner

### Data Display Components
- Table, Pagination, Resizable

### Interactive Components
- Toggle, Toggle Group, Tooltip, Scroll Area, Form

## 🛠️ Available Scripts

```bash
# Development
npm start          # Start Metro bundler
npm run android    # Run on Android
npm run ios        # Run on iOS

# Building
npm run build      # Build for production

# Testing
npm test           # Run tests

# Linting
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
```

## 🎯 Key Features

- ✅ **React Native** - Full React Native compatibility
- ✅ **TypeScript** - Complete TypeScript support
- ✅ **Tailwind CSS** - Styling with NativeWind
- ✅ **Navigation** - React Navigation integration
- ✅ **Icons** - Lucide React Native icons
- ✅ **Animations** - React Native Reanimated
- ✅ **Gestures** - React Native Gesture Handler
- ✅ **Forms** - React Hook Form compatibility
- ✅ **Cross-Platform** - iOS and Android support

## 🔄 Migration Notes

The components have been converted from React web to React Native with the following changes:

1. **HTML Elements → React Native:**
   - `div` → `View`
   - `button` → `TouchableOpacity`
   - `input` → `TextInput`

2. **Event Handlers:**
   - `onClick` → `onPress`
   - `onChange` → `onChangeText`

3. **Styling:**
   - CSS properties adapted to React Native style objects
   - Tailwind classes maintained through NativeWind

4. **Libraries:**
   - Web-specific libraries replaced with React Native alternatives
   - Custom implementations for complex components

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx react-native start --reset-cache
   ```

2. **iOS build issues:**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build issues:**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

4. **NativeWind not working:**
   - Ensure `nativewind/css` is imported in your app
   - Check `tailwind.config.js` configuration

### Getting Help

- Check the [React Native documentation](https://reactnative.dev/)
- Review the [NativeWind documentation](https://www.nativewind.dev/)
- Check the [React Navigation documentation](https://reactnavigation.org/)

## 📄 License

This project is licensed under the MIT License.
