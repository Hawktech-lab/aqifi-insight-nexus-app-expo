import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { DeviceFingerprintingProvider } from './contexts/DeviceFingerprintingContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MainNavigator } from './navigation/MainNavigator';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DeviceFingerprintingProvider>
          <ErrorBoundary onError={(error) => console.error('App Error:', error)}>
            <MainNavigator />
          </ErrorBoundary>
        </DeviceFingerprintingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
