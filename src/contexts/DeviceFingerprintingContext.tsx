import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import DeviceFingerprintingService, { DeviceFingerprint } from '../services/DeviceFingerprintingService';
import { useAuth } from './AuthContext';

interface DeviceFingerprintingContextType {
  deviceFingerprint: DeviceFingerprint | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  trackEvent: (eventType: string, eventData?: Record<string, any>) => Promise<void>;
  refreshDeviceFingerprint: () => Promise<void>;
}

const DeviceFingerprintingContext = createContext<DeviceFingerprintingContextType | undefined>(undefined);

export function DeviceFingerprintingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [deviceFingerprint, setDeviceFingerprint] = useState<DeviceFingerprint | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [fingerprintId, setFingerprintId] = useState<string | null>(null);
  
  // Use refs to avoid stale closures
  const deviceFingerprintingService = useRef(DeviceFingerprintingService.getInstance());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically initialize device fingerprinting when app starts
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeDeviceFingerprinting();
    }
  }, [isInitialized, isLoading]);

  // Auto-refresh device fingerprint every 5 minutes
  useEffect(() => {
    if (!isInitialized) return;

    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(async () => {
      try {
        await refreshDeviceFingerprint();
      } catch (error) {
        console.error('Failed to refresh device fingerprint:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (currentSessionId) {
        endDeviceSession(currentSessionId);
      }
    };
  }, [currentSessionId]);

  const saveDeviceFingerprint = useCallback(async (): Promise<string | null> => {
    if (!user) {
      console.log('No user authenticated, skipping device fingerprint save');
      return null;
    }

    try {
      const id = await deviceFingerprintingService.current.saveDeviceFingerprint(user.id);
      setFingerprintId(id);
      return id;
    } catch (error) {
      console.error('Failed to save device fingerprint:', error);
      setError(error instanceof Error ? error.message : 'Failed to save device fingerprint');
      return null;
    }
  }, [user]);

  const trackEvent = useCallback(async (eventType: string, eventData: Record<string, any> = {}): Promise<void> => {
    if (!user) {
      console.log('No user authenticated, skipping event tracking:', eventType);
      return;
    }

    try {
      // Use existing fingerprintId or create new one
      const id = fingerprintId || await saveDeviceFingerprint();
      if (!id) return;

      await deviceFingerprintingService.current.trackEvent(
        user.id,
        id,
        eventType,
        eventData,
        currentSessionId || undefined
      );
    } catch (error) {
      console.error('Failed to track event:', error);
      // Don't set error for analytics tracking failures
    }
  }, [user, fingerprintId, currentSessionId, saveDeviceFingerprint]);

  const createDeviceSession = useCallback(async (): Promise<string | null> => {
    if (!user) {
      console.log('No user authenticated, skipping device session creation');
      return null;
    }

    try {
      const id = fingerprintId || await saveDeviceFingerprint();
      if (!id) return null;

      const sessionId = await deviceFingerprintingService.current.createDeviceSession(user.id, id);
      setCurrentSessionId(sessionId);

      // Track session start
      await trackEvent('session_start', {
        session_id: sessionId,
        device_fingerprint_id: id,
      });

      return sessionId;
    } catch (error) {
      console.error('Failed to create device session:', error);
      setError(error instanceof Error ? error.message : 'Failed to create device session');
      return null;
    }
  }, [user, fingerprintId, saveDeviceFingerprint, trackEvent]);

  const endDeviceSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await deviceFingerprintingService.current.endDeviceSession(sessionId);
      setCurrentSessionId(null);

      // Track session end
      await trackEvent('session_end', {
        session_id: sessionId,
      });
    } catch (error) {
      console.error('Failed to end device session:', error);
      setError(error instanceof Error ? error.message : 'Failed to end device session');
    }
  }, [trackEvent]);

  const saveDevicePermissions = useCallback(async (
    permissions: Record<string, boolean>, 
    consentVersion: string
  ): Promise<void> => {
    if (!user) {
      console.log('No user authenticated, skipping device permissions save');
      return;
    }

    try {
      const id = fingerprintId || await saveDeviceFingerprint();
      if (!id) return;

      await deviceFingerprintingService.current.saveDevicePermissions(
        user.id,
        id,
        permissions,
        consentVersion
      );
    } catch (error) {
      console.error('Failed to save device permissions:', error);
      setError(error instanceof Error ? error.message : 'Failed to save device permissions');
    }
  }, [user, fingerprintId, saveDeviceFingerprint]);

  const initializeDeviceFingerprinting = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize device fingerprinting service
      await deviceFingerprintingService.current.initialize();
      const fingerprint = deviceFingerprintingService.current.getDeviceFingerprint();
      setDeviceFingerprint(fingerprint);
      setIsInitialized(true);

      // Only save to database and create session if user is authenticated
      if (user) {
        // Save device fingerprint to database
        await saveDeviceFingerprint();

        // Create device session
        await createDeviceSession();

        // Automatically save default permissions (user agreed to terms)
        await saveDevicePermissions({
          device_data: true,
          analytics: true,
          monetization: true,
        }, '1.0.0');

        // Track initialization event
        await trackEvent('device_fingerprinting_initialized', {
          device_id: fingerprint?.device_id,
          os_type: fingerprint?.os_type,
          device_model: fingerprint?.device_model,
        });
      } else {
        // Still track initialization for anonymous users
        console.log('Device fingerprinting initialized for anonymous user:', {
          device_id: fingerprint?.device_id,
          os_type: fingerprint?.os_type,
          device_model: fingerprint?.device_model,
        });
      }

    } catch (error) {
      console.error('Failed to initialize device fingerprinting:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize device fingerprinting');
      // Don't throw error, just log it and continue with basic fingerprint
    } finally {
      setIsLoading(false);
    }
  }, [user, saveDeviceFingerprint, createDeviceSession, saveDevicePermissions, trackEvent]);

  const refreshDeviceFingerprint = useCallback(async (): Promise<void> => {
    try {
      await deviceFingerprintingService.current.refreshDeviceFingerprint();
      const updatedFingerprint = deviceFingerprintingService.current.getDeviceFingerprint();
      setDeviceFingerprint(updatedFingerprint);

      // Save updated fingerprint to database only if user is authenticated
      if (user) {
        await saveDeviceFingerprint();
      }
    } catch (error) {
      console.error('Failed to refresh device fingerprint:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh device fingerprint');
    }
  }, [user, saveDeviceFingerprint]);

  const value: DeviceFingerprintingContextType = {
    deviceFingerprint,
    isInitialized,
    isLoading,
    error,
    trackEvent,
    refreshDeviceFingerprint,
  };

  return (
    <DeviceFingerprintingContext.Provider value={value}>
      {children}
    </DeviceFingerprintingContext.Provider>
  );
}

export function useDeviceFingerprinting() {
  const context = useContext(DeviceFingerprintingContext);
  if (context === undefined) {
    throw new Error('useDeviceFingerprinting must be used within a DeviceFingerprintingProvider');
  }
  return context;
}



