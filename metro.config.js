const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

/**
 * Metro configuration for Expo
 * https://docs.expo.dev/guides/customizing-metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Configure path aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@/components': path.resolve(__dirname, 'src/components'),
  '@/lib': path.resolve(__dirname, 'src/lib'),
  '@/utils': path.resolve(__dirname, 'src/utils'),
  '@/hooks': path.resolve(__dirname, 'src/hooks'),
  '@/pages': path.resolve(__dirname, 'src/pages'),
  '@/services': path.resolve(__dirname, 'src/services'),
  '@/contexts': path.resolve(__dirname, 'src/contexts'),
  '@/types': path.resolve(__dirname, 'src/types'),
  '@/assets': path.resolve(__dirname, 'src/assets'),
  '@/integrations': path.resolve(__dirname, 'src/integrations'),
  // Essential polyfills for Supabase
  crypto: 'react-native-crypto',
  stream: 'readable-stream',
  buffer: '@craftzdog/react-native-buffer',
};

module.exports = config;
