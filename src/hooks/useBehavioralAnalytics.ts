import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import BehavioralAnalyticsService, { BehavioralInsight, BehavioralEvent } from '../services/BehavioralAnalyticsService';
import { useDeviceFingerprinting } from '../contexts/DeviceFingerprintingContext';
import { supabase } from '../integrations/supabase/client';

export function useBehavioralAnalytics(
  toggleDataStream?: (streamId: string, enabled: boolean) => Promise<void>
) {
  const { user } = useAuth();
  const { trackEvent } = useDeviceFingerprinting();
  const [behavioralService] = useState(() => BehavioralAnalyticsService.getInstance());
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [behavioralStream, setBehavioralStream] = useState<any>(null);
  const [insights, setInsights] = useState<BehavioralInsight[]>([]);

  // Get behavioral stream from database
  useEffect(() => {
    if (user) {
      fetchBehavioralStream();
    }
  }, [user]);

  const fetchBehavioralStream = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('data_streams')
        .select('*')
        .eq('user_id', user.id)
        .eq('stream_type', 'behavioral')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching behavioral stream:', error);
      } else {
        setBehavioralStream(data);
      }
    } catch (error) {
      console.error('Error fetching behavioral stream:', error);
    }
  };

  // Initialize behavioral service when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      initializeBehavioralService();
    }
  }, [user, isInitialized]);

  // Refresh behavioral stream when needed
  useEffect(() => {
    if (isInitialized) {
      fetchBehavioralStream();
    }
  }, [isInitialized]);

  // Cleanup when user signs out or component unmounts
  useEffect(() => {
    if (!user) {
      // User signed out, clean up service
      setIsInitialized(false);
      setBehavioralStream(null);
      setInsights([]);
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any ongoing operations
      setIsInitialized(false);
      setIsAnalyzing(false);
    };
  }, []);

  const initializeBehavioralService = async () => {
    if (!user) return;

    try {
      await behavioralService.initialize(user.id);
      setIsInitialized(true);
      
      // Track initialization
      if (trackEvent) {
        trackEvent('behavioral_service_initialized');
      }
      
      console.log('Behavioral service initialized');
    } catch (error) {
      console.error('Failed to initialize behavioral service:', error);
    }
  };

  const enableBehavioralStream = async () => {
    if (!behavioralStream) return;

    try {
      await toggleDataStream?.(behavioralStream.id, true);
      
      // Track enable
      if (trackEvent) {
        trackEvent('behavioral_stream_enabled');
      }
      
      console.log('Behavioral stream enabled');
    } catch (error) {
      console.error('Failed to enable behavioral stream:', error);
      Alert.alert(
        'Error',
        'Failed to enable behavioral analytics.',
        [{ text: 'OK' }]
      );
    }
  };

  const disableBehavioralStream = async () => {
    if (!behavioralStream) return;

    try {
      await toggleDataStream?.(behavioralStream.id, false);
      
      // Track disable
      if (trackEvent) {
        trackEvent('behavioral_stream_disabled');
      }
      
      console.log('Behavioral stream disabled');
    } catch (error) {
      console.error('Failed to disable behavioral stream:', error);
      Alert.alert(
        'Error',
        'Failed to disable behavioral analytics.',
        [{ text: 'OK' }]
      );
    }
  };

  const analyzeBehavior = useCallback(async (): Promise<BehavioralInsight[]> => {
    if (!isInitialized) {
      throw new Error('Behavioral service not initialized');
    }

    setIsAnalyzing(true);
    try {
      const newInsights = await behavioralService.analyzeUserBehavior();
      setInsights(newInsights);
      
      // Track analysis
      if (trackEvent) {
        trackEvent('behavioral_analysis_completed', { insight_count: newInsights.length });
      }
      
      console.log('Behavioral analysis completed:', newInsights.length, 'insights');
      return newInsights;
    } catch (error) {
      console.error('Failed to analyze behavior:', error);
      Alert.alert(
        'Analysis Error',
        'Failed to analyze user behavior. Please try again.',
        [{ text: 'OK' }]
      );
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, [isInitialized, trackEvent]);

  const trackBehavioralEvent = useCallback(async (eventType: string, eventData?: Record<string, any>) => {
    try {
      await behavioralService.trackEvent(eventType, eventData);
      
      // Track event tracking
      if (trackEvent) {
        trackEvent('behavioral_event_tracked', { event_type: eventType });
      }
    } catch (error) {
      console.error('Failed to track behavioral event:', error);
    }
  }, [trackEvent]);

  const getBehavioralHistory = useCallback(async (limit: number = 50): Promise<BehavioralEvent[]> => {
    try {
      const history = await behavioralService.getBehavioralHistory(limit);
      return history;
    } catch (error) {
      console.error('Failed to get behavioral history:', error);
      return [];
    }
  }, []);

  const requestBehavioralPermission = async () => {
    try {
      await initializeBehavioralService();
      return true;
    } catch (error) {
      console.error('Failed to request behavioral permission:', error);
      return false;
    }
  };

  return {
    // State
    isInitialized,
    isAnalyzing,
    behavioralStream,
    insights,
    
    // Actions
    enableBehavioralStream,
    disableBehavioralStream,
    analyzeBehavior,
    trackBehavioralEvent,
    getBehavioralHistory,
    requestBehavioralPermission,
    
    // Status
    isEnabled: behavioralStream?.is_enabled || false,
    dataCount: behavioralStream?.data_count || 0,
    earningsRate: behavioralStream?.earnings_rate || 0,
    lastSync: behavioralStream?.last_sync_at,
  };
}
