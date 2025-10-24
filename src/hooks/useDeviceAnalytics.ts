import { useCallback } from 'react';
import { useDeviceFingerprinting } from '../contexts/DeviceFingerprintingContext';

export const useDeviceAnalytics = () => {
  const { trackEvent, deviceFingerprint } = useDeviceFingerprinting();

  const trackAppOpen = useCallback(() => {
    trackEvent('app_open', {
      timestamp: new Date().toISOString(),
      device_info: {
        os_type: deviceFingerprint?.os_type,
        device_model: deviceFingerprint?.device_model,
        app_version: deviceFingerprint?.app_version,
      },
    });
  }, [trackEvent, deviceFingerprint]);

  const trackScreenView = useCallback((screenName: string, screenParams?: Record<string, any>) => {
    trackEvent('screen_view', {
      screen_name: screenName,
      screen_params: screenParams,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const trackFeatureUsage = useCallback((featureName: string, featureData?: Record<string, any>) => {
    trackEvent('feature_used', {
      feature_name: featureName,
      feature_data: featureData,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const trackUserAction = useCallback((actionName: string, actionData?: Record<string, any>) => {
    trackEvent('user_action', {
      action_name: actionName,
      action_data: actionData,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const trackError = useCallback((errorType: string, errorMessage: string, errorData?: Record<string, any>) => {
    trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      error_data: errorData,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const trackPerformance = useCallback((metricName: string, metricValue: number, metricUnit?: string) => {
    trackEvent('performance', {
      metric_name: metricName,
      metric_value: metricValue,
      metric_unit: metricUnit,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const trackDeviceState = useCallback(() => {
    if (!deviceFingerprint) return;

    trackEvent('device_state', {
      battery_level: deviceFingerprint.battery_level,
      is_charging: deviceFingerprint.is_charging,
      network_type: deviceFingerprint.network_type,
      available_ram_mb: deviceFingerprint.available_ram_mb,
      available_storage_gb: deviceFingerprint.available_storage_gb,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent, deviceFingerprint]);

  const trackCustomEvent = useCallback((eventType: string, eventData?: Record<string, any>) => {
    trackEvent(eventType, {
      ...eventData,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  return {
    trackAppOpen,
    trackScreenView,
    trackFeatureUsage,
    trackUserAction,
    trackError,
    trackPerformance,
    trackDeviceState,
    trackCustomEvent,
    deviceFingerprint,
  };
};



