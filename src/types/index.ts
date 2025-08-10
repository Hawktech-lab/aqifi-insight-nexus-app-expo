// DELETE: vite-env.d.ts is not needed in React Native
// Vite is a web bundler - React Native uses Metro bundler

// Instead, React Native projects typically have these type definition files:

// 1. types/index.ts (or globals.d.ts) - for custom type definitions
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}

// 2. If using React Native Vector Icons
declare module 'react-native-vector-icons/Ionicons' {
  import { Icon } from 'react-native-vector-icons/Icon';
  const Ionicons: Icon;
  export default Ionicons;
}

// 3. Environment variables (if needed)
declare module '@env' {
  export const API_URL: string;
  export const ENV: string;
}

// Note: React Native has built-in TypeScript support and doesn't need vite/client types
// The Metro bundler handles module resolution and bundling
