import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { supabase } from '../integrations/supabase/client';
import ConfigurationService from './ConfigurationService';
import SpatialDataService from './SpatialDataService';

export interface LocationData {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: string;
  location_type: 'gps' | 'network' | 'passive';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface LocationStreamConfig {
  isEnabled: boolean;
  updateInterval: number; // in milliseconds
  accuracy: Location.Accuracy;
  distanceFilter: number; // in meters
  backgroundUpdates: boolean;
  earningsRate: number;
}

class LocationDataService {
  private static instance: LocationDataService;
  private locationSubscription: Location.LocationSubscription | null = null;
  private isInitialized = false;
  private currentUserId: string | null = null;
  private configService: ConfigurationService;
  private config: LocationStreamConfig = {
    isEnabled: false,
    updateInterval: 300000, // Default: 5 minutes
    accuracy: Location.Accuracy.Balanced,
    distanceFilter: 100, // Default: 100 meters
    backgroundUpdates: true, // Enable background updates by default
    earningsRate: 0.005, // Default: $0.005 per point
  };

  private constructor() {
    this.configService = ConfigurationService.getInstance();
  }

  public static getInstance(): LocationDataService {
    if (!LocationDataService.instance) {
      LocationDataService.instance = new LocationDataService();
    }
    return LocationDataService.instance;
  }

  public async initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.currentUserId === userId) return;

    this.currentUserId = userId;
    
    try {
      // Load configuration from database
      await this.loadConfiguration();
      
      // Check current permission status first
      let { status } = await Location.getForegroundPermissionsAsync();
      
      // Only request permission if not already granted
      if (status !== 'granted') {
        const permissionResult = await Location.requestForegroundPermissionsAsync();
        status = permissionResult.status;
        
        if (status !== 'granted') {
          throw new Error('Location permission not granted');
        }
      }

      // Check and request background permissions if needed
      if (this.config.backgroundUpdates) {
        let { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
        
        // Only request background permission if not already granted
        if (backgroundStatus !== 'granted') {
          const backgroundPermissionResult = await Location.requestBackgroundPermissionsAsync();
          backgroundStatus = backgroundPermissionResult.status;
        }
        
        if (backgroundStatus !== 'granted') {
          console.warn('Background location permission not granted');
        }
      }

      this.isInitialized = true;
      console.log('LocationDataService initialized successfully with config:', this.config);
    } catch (error) {
      console.error('Failed to initialize LocationDataService:', error);
      throw error;
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      // Load configuration from database
      const updateInterval = await this.configService.getConfigValueAsNumber('location', 'update_interval');
      const distanceFilter = await this.configService.getConfigValueAsNumber('location', 'distance_filter');
      const accuracy = await this.configService.getConfigValue('location', 'accuracy');
      const backgroundUpdates = await this.configService.getConfigValueAsBoolean('location', 'background_updates');
      const earningsRate = await this.configService.getConfigValueAsNumber('location', 'earnings_rate');

      // Update config with database values
      this.config.updateInterval = updateInterval || this.config.updateInterval;
      this.config.distanceFilter = distanceFilter || this.config.distanceFilter;
      this.config.backgroundUpdates = backgroundUpdates ?? this.config.backgroundUpdates;
      this.config.earningsRate = earningsRate || this.config.earningsRate;

      // Map accuracy string to Location.Accuracy enum
      if (accuracy) {
        switch (accuracy.toLowerCase()) {
          case 'low':
            this.config.accuracy = Location.Accuracy.Low;
            break;
          case 'balanced':
            this.config.accuracy = Location.Accuracy.Balanced;
            break;
          case 'high':
            this.config.accuracy = Location.Accuracy.High;
            break;
          case 'best':
            this.config.accuracy = Location.Accuracy.BestForNavigation;
            break;
          default:
            this.config.accuracy = Location.Accuracy.Balanced;
        }
      }

      console.log('Location configuration loaded from database:', this.config);
    } catch (error) {
      console.error('Failed to load location configuration, using defaults:', error);
      // Keep default values if database config fails to load
    }
  }

  public async startLocationTracking(): Promise<void> {
    if (!this.isInitialized || !this.currentUserId) {
      throw new Error('LocationDataService not initialized');
    }

    // Reload configuration before starting tracking
    await this.loadConfiguration();

    if (this.locationSubscription) {
      await this.stopLocationTracking();
    }

    try {
      if (this.config.backgroundUpdates) {
        // Define background task once
        defineBackgroundTaskOnce();
        await Location.startLocationUpdatesAsync(BACKGROUND_TASK_NAME, {
          accuracy: this.config.accuracy,
          distanceInterval: this.config.distanceFilter,
          timeInterval: this.config.updateInterval,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: false,
          foregroundService: {
            notificationTitle: 'Location sharing active',
            notificationBody: 'Your location is being collected to reward you for data sharing.',
            notificationColor: '#1D4ED8',
          },
        });
      } else {
        // Start foreground watcher
        this.locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: this.config.accuracy,
            distanceInterval: this.config.distanceFilter,
            timeInterval: this.config.updateInterval,
            mayShowUserSettingsDialog: true,
          },
          (location) => {
            this.handleLocationUpdate(location);
          }
        );
      }

      console.log('Location tracking started with config:', {
        updateInterval: this.config.updateInterval,
        distanceFilter: this.config.distanceFilter,
        accuracy: this.config.accuracy,
        earningsRate: this.config.earningsRate
      });
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      throw error;
    }
  }

  public async stopLocationTracking(): Promise<void> {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      console.log('Location tracking stopped');
    }
    try {
      const has = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
      if (has) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_TASK_NAME);
        console.log('Background location updates stopped');
      }
    } catch {}
  }

  private async handleLocationUpdate(location: Location.LocationObject): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const locationData: Omit<LocationData, 'id'> = {
        user_id: this.currentUserId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: new Date(location.timestamp).toISOString(),
        location_type: 'gps',
      };

      // Try to get address information
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addressResponse.length > 0) {
          const address = addressResponse[0];
          locationData.address = address.street ? `${address.street} ${address.streetNumber || ''}`.trim() : undefined;
          locationData.city = address.city;
          locationData.state = address.region;
          locationData.country = address.country;
          locationData.postal_code = address.postalCode;
        }
      } catch (addressError) {
        console.warn('Failed to get address information:', addressError);
      }

      // Save to database
      await this.saveLocationData(locationData);

      // Update data stream count with current earnings rate
      await this.updateDataStreamCount();

      // Feed spatial derivation (best-effort)
      try {
        const spatial = SpatialDataService.getInstance();
        await spatial.handleLocation(this.currentUserId, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        });
      } catch {}

    } catch (error) {
      console.error('Failed to handle location update:', error);
    }
  }

  private async saveLocationData(locationData: Omit<LocationData, 'id'>): Promise<void> {
    try {
      // Store location data as an earnings transaction instead of a separate table
      const earningsAmount = this.config.earningsRate;
      
      const { error } = await supabase
        .from('earnings_transactions')
        .insert({
          user_id: locationData.user_id,
          amount: earningsAmount,
          points: 1, // Each location point = 1 point
          transaction_type: 'location_data',
          description: `Location data collected at ${locationData.timestamp}`,
          reference_id: null, // reference_id is UUID type, not JSON - set to null for location data
        });

      if (error) throw error;
      console.log('Location data saved as earnings transaction successfully');
    } catch (error) {
      console.error('Failed to save location data:', error);
      throw error;
    }
  }

  private async updateDataStreamCount(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      // Get current count from earnings transactions
      const { count } = await supabase
        .from('earnings_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.currentUserId)
        .eq('transaction_type', 'location_data');

      // Update data stream with current earnings rate
      const { error } = await supabase
        .from('data_streams')
        .update({ 
          data_count: count || 0,
          earnings_rate: this.config.earningsRate,
          last_sync_at: new Date().toISOString()
        })
        .eq('user_id', this.currentUserId)
        .eq('stream_type', 'location');

      if (error) throw error;
      console.log('Data stream count updated:', count, 'earnings rate:', this.config.earningsRate);
    } catch (error) {
      console.error('Failed to update data stream count:', error);
    }
  }

  public async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: this.config.accuracy,
      });
      return location;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }

  public async getLocationHistory(limit: number = 50): Promise<LocationData[]> {
    if (!this.currentUserId) return [];

    try {
      const { data, error } = await supabase
        .from('earnings_transactions')
        .select('*')
        .eq('user_id', this.currentUserId)
        .eq('transaction_type', 'location_data')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Convert earnings transactions back to LocationData format
      const locationData: LocationData[] = (data || []).map(transaction => {
        const locationInfo = {}; // reference_id is now null, no JSON parsing needed
        return {
          id: transaction.id,
          user_id: transaction.user_id,
          latitude: locationInfo.latitude || 0,
          longitude: locationInfo.longitude || 0,
          accuracy: locationInfo.accuracy || null,
          altitude: null, // Not stored in earnings transactions
          heading: null, // Not stored in earnings transactions
          speed: null, // Not stored in earnings transactions
          timestamp: locationInfo.timestamp || transaction.created_at,
          location_type: locationInfo.location_type || 'gps',
          address: locationInfo.address,
          city: locationInfo.city,
          state: locationInfo.state,
          country: locationInfo.country,
          postal_code: locationInfo.postal_code,
        };
      });
      
      return locationData;
    } catch (error) {
      console.error('Failed to get location history:', error);
      return [];
    }
  }

  public async updateConfig(newConfig: Partial<LocationStreamConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    console.log('Location config updated:', this.config);
  }

  public getConfig(): LocationStreamConfig {
    return { ...this.config };
  }

  public async refreshConfiguration(): Promise<void> {
    await this.loadConfiguration();
    console.log('Location configuration refreshed:', this.config);
  }

  public async checkPermissionStatus(): Promise<{ foreground: string; background: string }> {
    try {
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      const backgroundStatus = await Location.getBackgroundPermissionsAsync();
      
      return {
        foreground: foregroundStatus.status,
        background: backgroundStatus.status
      };
    } catch (error) {
      console.error('Failed to check permission status:', error);
      return {
        foreground: 'undetermined',
        background: 'undetermined'
      };
    }
  }

  public async cleanup(): Promise<void> {
    await this.stopLocationTracking();
    this.isInitialized = false;
    this.currentUserId = null;
  }
}

const BACKGROUND_TASK_NAME = 'AQIFI_BACKGROUND_LOCATION';

let backgroundTaskDefined = false;
function defineBackgroundTaskOnce() {
  if (backgroundTaskDefined) return;
  TaskManager.defineTask(BACKGROUND_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error('Background location task error:', error);
      return;
    }
    const { locations } = data as any;
    try {
      const service = LocationDataService.getInstance();
      for (const loc of locations ?? []) {
        await service['handleLocationUpdate'](loc);
      }
    } catch (e) {
      console.error('Failed handling background locations:', e);
    }
  });
  backgroundTaskDefined = true;
}

export default LocationDataService;
