import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import SpatialDataService from '../services/SpatialDataService';
import { useDeviceFingerprinting } from '../contexts/DeviceFingerprintingContext';
import { supabase } from '../integrations/supabase/client';

export interface SpatialData {
  id: string;
  user_id: string;
  cell_lat: number;
  cell_lon: number;
  dwell_ms: number;
  visited_at: string;
}

export function useSpatialData(
  toggleDataStream?: (streamId: string, enabled: boolean) => Promise<void>
) {
  const { user } = useAuth();
  const { trackEvent } = useDeviceFingerprinting();
  const [spatialService] = useState(() => SpatialDataService.getInstance());
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [spatialStream, setSpatialStream] = useState<any>(null);

  // Get spatial stream from database
  useEffect(() => {
    if (user) {
      fetchSpatialStream();
    }
  }, [user]);

  const fetchSpatialStream = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('data_streams')
        .select('*')
        .eq('user_id', user.id)
        .eq('stream_type', 'spatial')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching spatial stream:', error);
      } else {
        setSpatialStream(data);
      }
    } catch (error) {
      console.error('Error fetching spatial stream:', error);
    }
  };

  // Initialize spatial service when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      initializeSpatialService();
    }
  }, [user, isInitialized]);

  // Refresh spatial stream when needed
  useEffect(() => {
    if (isInitialized) {
      fetchSpatialStream();
    }
  }, [isInitialized]);

  // Cleanup when user signs out or component unmounts
  useEffect(() => {
    if (!user) {
      // User signed out, clean up service
      setIsInitialized(false);
      setSpatialStream(null);
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any ongoing operations
      setIsInitialized(false);
    };
  }, []);

  const initializeSpatialService = async () => {
    if (!user) return;

    try {
      await spatialService.initialize(user.id);
      setIsInitialized(true);
      
      // Track initialization
      if (trackEvent) {
        trackEvent('spatial_service_initialized');
      }
      
      console.log('Spatial service initialized');
    } catch (error) {
      console.error('Failed to initialize spatial service:', error);
    }
  };

  const enableSpatialStream = async () => {
    if (!spatialStream) return;

    try {
      await toggleDataStream?.(spatialStream.id, true);
      
      // Track enable
      if (trackEvent) {
        trackEvent('spatial_stream_enabled');
      }
      
      console.log('Spatial stream enabled');
    } catch (error) {
      console.error('Failed to enable spatial stream:', error);
      Alert.alert(
        'Error',
        'Failed to enable spatial data collection.',
        [{ text: 'OK' }]
      );
    }
  };

  const disableSpatialStream = async () => {
    if (!spatialStream) return;

    try {
      await toggleDataStream?.(spatialStream.id, false);
      
      // Track disable
      if (trackEvent) {
        trackEvent('spatial_stream_disabled');
      }
      
      console.log('Spatial stream disabled');
    } catch (error) {
      console.error('Failed to disable spatial stream:', error);
      Alert.alert(
        'Error',
        'Failed to disable spatial data collection.',
        [{ text: 'OK' }]
      );
    }
  };

  const getSpatialHistory = useCallback(async (limit: number = 50) => {
    try {
      // Since spatial data is stored in earnings transactions, we'll get it from there
      const { data, error } = await supabase
        .from('earnings_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('transaction_type', 'spatial_data')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Convert earnings transactions back to SpatialData format
      const spatialData: SpatialData[] = (data || []).map(transaction => {
        const spatialInfo = {}; // reference_id is now null, no JSON parsing needed
        return {
          id: transaction.id,
          user_id: transaction.user_id,
          cell_lat: spatialInfo.cell_lat || 0,
          cell_lon: spatialInfo.cell_lon || 0,
          dwell_ms: spatialInfo.dwell_ms || 0,
          visited_at: spatialInfo.visited_at || transaction.created_at,
        };
      });
      
      return spatialData;
    } catch (error) {
      console.error('Failed to get spatial history:', error);
      return [];
    }
  }, [user?.id]);

  const requestSpatialPermission = async () => {
    try {
      await initializeSpatialService();
      return true;
    } catch (error) {
      console.error('Failed to request spatial permission:', error);
      return false;
    }
  };

  return {
    // State
    isInitialized,
    spatialStream,
    
    // Actions
    enableSpatialStream,
    disableSpatialStream,
    getSpatialHistory,
    requestSpatialPermission,
    
    // Status
    isEnabled: spatialStream?.is_enabled || false,
    dataCount: spatialStream?.data_count || 0,
    earningsRate: spatialStream?.earnings_rate || 0,
    lastSync: spatialStream?.last_sync_at,
  };
}
