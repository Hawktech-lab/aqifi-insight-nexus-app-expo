import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export interface WaitlistErrorScreenProps {
  errorType: 'invalid_campaign' | 'expired_campaign' | 'missing_campaign' | 'api_error';
  errorMessage?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
}

export const WaitlistErrorScreen: React.FC<WaitlistErrorScreenProps> = ({
  errorType,
  errorMessage,
  onRetry,
  onContactSupport,
}) => {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'invalid_campaign':
        return {
          icon: 'alert-circle-outline',
          iconColor: '#ef4444',
          title: 'Invalid Campaign Configuration',
          message: 'The waitlist campaign configuration is invalid. Please contact support to resolve this issue.',
          showRetry: false,
        };
      case 'expired_campaign':
        return {
          icon: 'time-outline',
          iconColor: '#f59e0b',
          title: 'Campaign Expired',
          message: 'The waitlist campaign has expired. Please contact support for information about joining the waitlist.',
          showRetry: false,
        };
      case 'missing_campaign':
        return {
          icon: 'settings-outline',
          iconColor: '#6b7280',
          title: 'Campaign Not Configured',
          message: 'The waitlist campaign is not configured. Please contact support for assistance.',
          showRetry: false,
        };
      case 'api_error':
        return {
          icon: 'cloud-offline-outline',
          iconColor: '#ef4444',
          title: 'Connection Error',
          message: errorMessage || 'Unable to connect to the waitlist service. Please check your connection and try again.',
          showRetry: true,
        };
      default:
        return {
          icon: 'alert-circle-outline',
          iconColor: '#ef4444',
          title: 'Waitlist Error',
          message: errorMessage || 'An error occurred while loading the waitlist. Please try again later.',
          showRetry: true,
        };
    }
  };

  const config = getErrorConfig();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${config.iconColor}15` }]}>
          <Icon name={config.icon} size={64} color={config.iconColor} />
        </View>
        
        <Text style={styles.title}>{config.title}</Text>
        
        <Text style={styles.message}>{config.message}</Text>
        
        {errorMessage && errorType !== 'api_error' && (
          <View style={styles.errorDetailsContainer}>
            <Text style={styles.errorDetailsLabel}>Details:</Text>
            <Text style={styles.errorDetailsText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {config.showRetry && onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Icon name="refresh-outline" size={20} color="#ffffff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          
          {onContactSupport && (
            <TouchableOpacity style={styles.supportButton} onPress={onContactSupport}>
              <Icon name="mail-outline" size={20} color="#3b82f6" />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetailsContainer: {
    width: '100%',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  errorDetailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 18,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  supportButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
});

