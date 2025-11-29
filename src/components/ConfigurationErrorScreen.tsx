import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ConfigurationErrorScreenProps {
  error: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const ConfigurationErrorScreen: React.FC<ConfigurationErrorScreenProps> = ({
  error,
  onRetry,
  isLoading = false
}) => {
  return (
    <View style={styles.container}>
      <Icon name="alert-circle-outline" size={64} color="#ef4444" style={styles.icon} />
      <Text style={styles.title}>Configuration Error</Text>
      <Text style={styles.message}>
        Unable to load application configuration. Please check your internet connection and try again.
      </Text>
      <Text style={styles.errorDetails}>{error}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Icon name="refresh" size={20} color="#ffffff" style={styles.retryIcon} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      <Text style={styles.footer}>
        If this problem persists, please contact support or try again later.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  errorDetails: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    minWidth: 150,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
});

