import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import DeviceFingerprintingService, { DeviceFingerprint } from '@/services/DeviceFingerprintingService';
import { useAuth } from './AuthContext';

interface DeviceFingerprintingContextType {
  deviceFingerprint: DeviceFingerprint | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initializeDeviceFingerprinting: () => Promise<void>;
  saveDeviceFingerprint: () => Promise<string | null>;
  createDeviceSession: () => Promise<string | null>;
  endDeviceSession: (sessionId: string) => Promise<void>;
  trackEvent: (eventType: string, eventData?: Record<string, any>) => Promise<void>;
  refreshDeviceFingerprint: () => Promise<void>;
  saveDevicePermissions: (permissions: Record<string, boolean>, consentVersion: string) => Promise<void>;
}

const DeviceFingerprintingContext = createContext<DeviceFingerprintingContextType | undefined>(undefined);

export function DeviceFingerprintingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [deviceFingerprint, setDeviceFingerprint] = useState<DeviceFingerprint | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const deviceFingerprintingService = DeviceFingerprintingService.getInstance();

  // Initialize device fingerprinting when user is authenticated
  useEffect(() => {
    if (user && !isInitialized) {
      initializeDeviceFingerprinting();
    }
  }, [user, isInitialized]);

  // Auto-refresh device fingerprint every 5 minutes
  useEffect(() => {
    if (!isInitialized) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshDeviceFingerprint();
      } catch (error) {
        console.error('Failed to refresh device fingerprint:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentSessionId) {
        endDeviceSession(currentSessionId);
      }
    };
  }, [currentSessionId]);

  const initializeDeviceFingerprinting = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      await deviceFingerprintingService.initialize();
      const fingerprint = deviceFingerprintingService.getDeviceFingerprint();
      setDeviceFingerprint(fingerprint);
      setIsInitialized(true);

      // Save device fingerprint to database
      await saveDeviceFingerprint();

      // Create device session
      await createDeviceSession();

      // Save default permissions (assuming user agreed to terms)
      await saveDevicePermissions({
        device_data: true,
        analytics: true,
        monetization: true,
      }, '1.0.0');

    } catch (error) {
      console.error('Failed to initialize device fingerprinting:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize device fingerprinting');
    } finally {
      setIsLoading(false);
    }
  };

  const saveDeviceFingerprint = async (): Promise<string | null> => {
    if (!user || !deviceFingerprint) return null;

    try {
      const fingerprintId = await deviceFingerprintingService.saveDeviceFingerprint(user.id);
      return fingerprintId;
    } catch (error) {
      console.error('Failed to save device fingerprint:', error);
      setError(error instanceof Error ? error.message : 'Failed to save device fingerprint');
      return null;
    }
  };

  const createDeviceSession = async (): Promise<string | null> => {
    if (!user || !deviceFingerprint) return null;

    try {
      const fingerprintId = await saveDeviceFingerprint();
      if (!fingerprintId) return null;

      const sessionId = await deviceFingerprintingService.createDeviceSession(user.id, fingerprintId);
      setCurrentSessionId(sessionId);

      // Track session start
      await trackEvent('session_start', {
        session_id: sessionId,
        device_fingerprint_id: fingerprintId,
      });

      return sessionId;
    } catch (error) {
      console.error('Failed to create device session:', error);
      setError(error instanceof Error ? error.message : 'Failed to create device session');
      return null;
    }
  };

  const endDeviceSession = async (sessionId: string): Promise<void> => {
    try {
      await deviceFingerprintingService.endDeviceSession(sessionId);
      setCurrentSessionId(null);

      // Track session end
      await trackEvent('session_end', {
        session_id: sessionId,
      });
    } catch (error) {
      console.error('Failed to end device session:', error);
      setError(error instanceof Error ? error.message : 'Failed to end device session');
    }
  };

  const trackEvent = async (eventType: string, eventData: Record<string, any> = {}): Promise<void> => {
    if (!user || !deviceFingerprint) return;

    try {
      const fingerprintId = await saveDeviceFingerprint();
      if (!fingerprintId) return;

      await deviceFingerprintingService.trackEvent(
        user.id,
        fingerprintId,
        eventType,
        eventData,
        currentSessionId || undefined
      );
    } catch (error) {
      console.error('Failed to track event:', error);
      // Don't set error for analytics tracking failures
    }
  };

  const refreshDeviceFingerprint = async (): Promise<void> => {
    try {
      await deviceFingerprintingService.refreshDeviceFingerprint();
      const updatedFingerprint = deviceFingerprintingService.getDeviceFingerprint();
      setDeviceFingerprint(updatedFingerprint);

      // Save updated fingerprint to database
      await saveDeviceFingerprint();
    } catch (error) {
      console.error('Failed to refresh device fingerprint:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh device fingerprint');
    }
  };

  const saveDevicePermissions = async (
    permissions: Record<string, boolean>, 
    consentVersion: string
  ): Promise<void> => {
    if (!user || !deviceFingerprint) return;

    try {
      const fingerprintId = await saveDeviceFingerprint();
      if (!fingerprintId) return;

      await deviceFingerprintingService.saveDevicePermissions(
        user.id,
        fingerprintId,
        permissions,
        consentVersion
      );
    } catch (error) {
      console.error('Failed to save device permissions:', error);
      setError(error instanceof Error ? error.message : 'Failed to save device permissions');
    }
  };

  const value: DeviceFingerprintingContextType = {
    deviceFingerprint,
    isInitialized,
    isLoading,
    error,
    initializeDeviceFingerprinting,
    saveDeviceFingerprint,
    createDeviceSession,
    endDeviceSession,
    trackEvent,
    refreshDeviceFingerprint,
    saveDevicePermissions,
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

