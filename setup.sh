#!/bin/bash

echo "🚀 Setting up AQIFI Insight Nexus App..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install React Native dependencies
echo "📱 Installing React Native dependencies..."
npm install react-native react-native-reanimated react-native-gesture-handler react-native-svg react-native-vector-icons react-native-safe-area-context react-native-screens

# Install navigation dependencies
echo "🧭 Installing navigation dependencies..."
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# Install styling dependencies
echo "🎨 Installing styling dependencies..."
npm install nativewind tailwind-merge class-variance-authority

# Install icon dependencies
echo "🎯 Installing icon dependencies..."
npm install lucide-react-native expo-status-bar

# Install development dependencies
echo "🔧 Installing development dependencies..."
npm install --save-dev @babel/core @babel/preset-env @babel/runtime @react-native/metro-config @types/react-native metro-react-native-babel-preset

# Check if running on macOS for iOS setup
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected. Setting up iOS dependencies..."
    if [ -d "ios" ]; then
        cd ios && pod install && cd ..
        echo "✅ iOS dependencies installed"
    else
        echo "⚠️  iOS directory not found. Skipping iOS setup."
    fi
else
    echo "🐧 Non-macOS system detected. Skipping iOS setup."
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start Metro bundler: npm start"
echo "2. Run on Android: npm run android"
echo "3. Run on iOS (macOS only): npm run ios"
echo ""
echo "For more information, see README.md"
