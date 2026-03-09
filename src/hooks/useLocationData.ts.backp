import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import LocationDataService, { LocationData, LocationStreamConfig } from '../services/LocationDataService';
import { useDeviceFingerprinting } from '../contexts/DeviceFingerprintingContext';
import { supabase } from '../integrations/supabase/client';

export function useLocationData(
  toggleDataStream?: (streamId: string, enabled: boolean) => Promise<void>
) {
  const { user } = useAuth();
  const { trackEvent } = useDeviceFingerprinting();
  const [locationService] = useState(() => LocationDataService.getInstance());
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [config, setConfig] = useState<LocationStreamConfig>(locationService.getConfig());
  const [locationStream, setLocationStream] = useState<any>(null);

  // Get location stream from database
  useEffect(() => {
    if (user) {
      fetchLocationStream();
    }
  }, [user]);

  const fetchLocationStream = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('data_streams')
        .select('*')
        .eq('user_id', user.id)
        .eq('stream_type', 'location')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching location stream:', error);
      } else {
        setLocationStream(data);
      }
    } catch (error) {
      console.error('Error fetching location stream:', error);
    }
  };

  // Initialize location service when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      initializeLocationService();
    }
  }, [user, isInitialized]);

  // Start/stop tracking based on stream status
  useEffect(() => {
    if (isInitialized && locationStream) {
      if (locationStream.is_enabled && !isTracking) {
        startLocationTracking();
      } else if (!locationStream.is_enabled && isTracking) {
        stopLocationTracking();
      }
    }
  }, [isInitialized, locationStream?.is_enabled, isTracking]);

  // Refresh location stream when tracking state changes
  useEffect(() => {
    if (isTracking !== undefined) {
      fetchLocationStream();
    }
  }, [isTracking]);

  // Cleanup when user signs out
  useEffect(() => {
    if (!user) {
      // User signed out, clean up service
      if (isTracking) {
        stopLocationTracking();
      }
      setIsInitialized(false);
      setLocationStream(null);
      setCurrentLocation(null);
      setLocationHistory([]);
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopLocationTracking();
      }
    };
  }, []);

  const initializeLocationService = async () => {
    if (!user) return;

    try {
      await locationService.initialize(user.id);
      setIsInitialized(true);
      
      // Track initialization
      if (trackEvent) {
        trackEvent('location_service_initialized');
      }
      
      console.log('Location service initialized');
    } catch (error) {
      console.error('Failed to initialize location service:', error);
      Alert.alert(
        'Location Permission Required',
        'Location permission is required to enable location data collection. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const startLocationTracking = async () => {
    if (!isInitialized) return;

    try {
      await locationService.startLocationTracking();
      setIsTracking(true);
      
      // Track start
      if (trackEvent) {
        trackEvent('location_tracking_started');
      }
      
      console.log('Location tracking started');
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      Alert.alert(
        'Location Error',
        'Failed to start location tracking. Please check your location settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopLocationTracking = async () => {
    try {
      await locationService.stopLocationTracking();
      setIsTracking(false);
      
      // Track stop
      if (trackEvent) {
        trackEvent('location_tracking_stopped');
      }
      
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
    }
  };

  const enableLocationStream = async () => {
    if (!locationStream) return;

    try {
      await toggleDataStream?.(locationStream.id, true);
      
      // Track enable
      if (trackEvent) {
        trackEvent('location_stream_enabled');
      }
      
      console.log('Location stream enabled');
    } catch (error) {
      console.error('Failed to enable location stream:', error);
      Alert.alert(
        'Error',
        'Failed to enable location data collection.',
        [{ text: 'OK' }]
      );
    }
  };

  const disableLocationStream = async () => {
    if (!locationStream) return;

    try {
      await toggleDataStream?.(locationStream.id, false);
      
      // Track disable
      if (trackEvent) {
        trackEvent('location_stream_disabled');
      }
      
      console.log('Location stream disabled');
    } catch (error) {
      console.error('Failed to disable location stream:', error);
      Alert.alert(
        'Error',
        'Failed to disable location data collection.',
        [{ text: 'OK' }]
      );
    }
  };

  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        const locationData: LocationData = {
          id: 'current',
          user_id: user?.id || '',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: new Date(location.timestamp).toISOString(),
          location_type: 'gps',
        };
        setCurrentLocation(locationData);
        return locationData;
      }
      return null;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }, [user?.id]);

  const getLocationHistory = useCallback(async (limit: number = 50) => {
    try {
      const history = await locationService.getLocationHistory(limit);
      setLocationHistory(history);
      return history;
    } catch (error) {
      console.error('Failed to get location history:', error);
      return [];
    }
  }, []);

  const updateLocationConfig = useCallback((newConfig: Partial<LocationStreamConfig>) => {
    locationService.updateConfig(newConfig);
    setConfig(locationService.getConfig());
    
    // Track config update
    if (trackEvent) {
      trackEvent('location_config_updated', newConfig);
    }
  }, [trackEvent]);

  const requestLocationPermission = async () => {
    try {
      await initializeLocationService();
      return true;
    } catch (error) {
      console.error('Failed to request location permission:', error);
      return false;
    }
  };

  const checkPermissionStatus = useCallback(async () => {
    try {
      return await locationService.checkPermissionStatus();
    } catch (error) {
      console.error('Failed to check permission status:', error);
      return { foreground: 'undetermined', background: 'undetermined' };
    }
  }, []);

  return {
    // State
    isInitialized,
    isTracking,
    currentLocation,
    locationHistory,
    config,
    locationStream,
    
    // Actions
    enableLocationStream,
    disableLocationStream,
    getCurrentLocation,
    getLocationHistory,
    updateLocationConfig,
    requestLocationPermission,
    checkPermissionStatus,
    
    // Status
    isEnabled: locationStream?.is_enabled || false,
    dataCount: locationStream?.data_count || 0,
    earningsRate: locationStream?.earnings_rate || 0,
    lastSync: locationStream?.last_sync_at,
  };
}
