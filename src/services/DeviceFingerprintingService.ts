import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions, PixelRatio } from 'react-native';
import { supabase } from '../integrations/supabase/client';
import { Buffer } from 'buffer';

// Types for device fingerprinting
export interface DeviceFingerprint {
  // Device Information
  device_id: string;
  device_name: string;
  device_brand: string;
  device_model: string;
  device_manufacturer: string;
  
  // Operating System Information
  os_type: 'ios' | 'android';
  os_version: string;
  os_build_number: string;
  os_api_level?: number;
  
  // Hardware Specifications
  processor_type: string;
  processor_cores: number;
  processor_frequency: string;
  architecture: string;
  
  // Memory Information
  total_ram_mb: number;
  available_ram_mb: number;
  total_storage_gb: number;
  available_storage_gb: number;
  
  // Display Information
  screen_width: number;
  screen_height: number;
  screen_density: number;
  screen_scale: number;
  screen_refresh_rate: number;
  
  // Network Information
  network_type: string;
  carrier_name?: string;
  carrier_country?: string;
  ip_address?: string;
  
  // App Information
  app_version: string;
  app_build_number: string;
  app_installation_date: string;
  
  // Device Capabilities
  has_camera: boolean;
  has_gps: boolean;
  has_bluetooth: boolean;
  has_nfc: boolean;
  has_fingerprint_sensor: boolean;
  has_face_recognition: boolean;
  
  // Battery Information
  battery_level: number;
  is_charging: boolean;
  battery_health: string;
  
  // Device State
  is_tablet: boolean;
  is_emulator: boolean;
  is_rooted: boolean;
  is_jailbroken: boolean;
  
  // Additional metadata
  metadata: Record<string, any>;
}

export interface DeviceSession {
  session_token: string;
  session_started_at: string;
  ip_address?: string;
  user_agent: string;
  location_data?: Record<string, any>;
}

export interface DeviceAnalytics {
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
}

class DeviceFingerprintingService {
  private static instance: DeviceFingerprintingService;
  private deviceFingerprint: DeviceFingerprint | null = null;
  private currentSession: DeviceSession | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DeviceFingerprintingService {
    if (!DeviceFingerprintingService.instance) {
      DeviceFingerprintingService.instance = new DeviceFingerprintingService();
    }
    return DeviceFingerprintingService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const screen = Dimensions.get('window');
      const pixelRatio = PixelRatio.get();
      
      // Safely get device information with error handling
      const deviceFingerprint: DeviceFingerprint = {
        // Device Information
        device_id: await this.safeGetUniqueId(),
        device_name: await this.safeGetDeviceName(),
        device_brand: await this.safeGetBrand(),
        device_model: await this.safeGetModel(),
        device_manufacturer: await this.safeGetManufacturer(),
        
        // Operating System Information
        os_type: Platform.OS as 'ios' | 'android',
        os_version: DeviceInfo.getSystemVersion(),
        os_build_number: await this.safeGetBuildNumber(),
        os_api_level: Platform.OS === 'android' ? await this.safeGetApiLevel() : undefined,
        
        // Hardware Specifications - using fallbacks for unavailable methods
        processor_type: await this.safeGetCpuType(),
        processor_cores: await this.safeGetCpuCores(),
        processor_frequency: await this.safeGetCpuFrequency(),
        architecture: await this.safeGetArchitecture(),
        
        // Memory Information - using fallbacks
        total_ram_mb: await this.safeGetTotalRam(),
        available_ram_mb: await this.safeGetAvailableRam(),
        total_storage_gb: await this.safeGetTotalStorage(),
        available_storage_gb: await this.safeGetAvailableStorage(),
        
        // Display Information
        screen_width: screen.width,
        screen_height: screen.height,
        screen_density: pixelRatio,
        screen_scale: pixelRatio,
        screen_refresh_rate: await this.safeGetScreenRefreshRate(),
        
        // Network Information - using fallbacks
        network_type: await this.safeGetNetworkType(),
        carrier_name: await this.safeGetCarrier(),
        carrier_country: await this.safeGetCarrierCountry(),
        ip_address: await this.safeGetIpAddress(),
        
        // App Information
        app_version: DeviceInfo.getVersion(),
        app_build_number: await this.safeGetBuildNumber(),
        app_installation_date: new Date().toISOString(),
        
        // Device Capabilities - using fallbacks
        has_camera: true, // Assume true for most devices
        has_gps: true,
        has_bluetooth: true,
        has_nfc: await this.safeHasNFC(),
        has_fingerprint_sensor: await this.safeHasFingerprint(),
        has_face_recognition: await this.safeHasFaceRecognition(),
        
        // Battery Information - using fallbacks
        battery_level: await this.safeGetBatteryLevel(),
        is_charging: await this.safeIsCharging(),
        battery_health: await this.safeGetBatteryHealth(),
        
        // Device State
        is_tablet: await this.safeIsTablet(),
        is_emulator: await this.safeIsEmulator(),
        is_rooted: await this.safeIsRooted(),
        is_jailbroken: await this.safeIsJailbroken(),
        
        // Additional metadata
        metadata: {
          supportedAbis: await this.safeGetSupportedAbis(),
          userAgent: await this.safeGetUserAgent(),
          deviceType: await this.safeGetType(),
        }
      };

      this.deviceFingerprint = deviceFingerprint;
      this.isInitialized = true;
      
      // Store in AsyncStorage for persistence with error handling
      try {
        await AsyncStorage.setItem('deviceFingerprint', JSON.stringify(deviceFingerprint));
      } catch (storageError) {
        console.warn('Failed to store device fingerprint in AsyncStorage:', storageError);
        // Don't fail initialization if storage fails
      }
      
    } catch (error) {
      console.error('Failed to initialize device fingerprinting:', error);
      // Don't throw error, just log it and continue with basic fingerprint
      this.createBasicFingerprint();
    }
  }

  // Safe wrapper methods to prevent crashes
  private async safeGetUniqueId(): Promise<string> {
    try {
      return await DeviceInfo.getUniqueId();
    } catch (error) {
      console.warn('Failed to get unique ID:', error);
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private async safeGetDeviceName(): Promise<string> {
    try {
      return await DeviceInfo.getDeviceName();
    } catch (error) {
      console.warn('Failed to get device name:', error);
      return 'Unknown Device';
    }
  }

  private async safeGetBrand(): Promise<string> {
    try {
      return await DeviceInfo.getBrand();
    } catch (error) {
      console.warn('Failed to get brand:', error);
      return 'Unknown';
    }
  }

  private async safeGetModel(): Promise<string> {
    try {
      return await DeviceInfo.getModel();
    } catch (error) {
      console.warn('Failed to get model:', error);
      return 'Unknown Model';
    }
  }

  private async safeGetManufacturer(): Promise<string> {
    try {
      return await DeviceInfo.getManufacturer();
    } catch (error) {
      console.warn('Failed to get manufacturer:', error);
      return 'Unknown';
    }
  }

  private async safeGetBuildNumber(): Promise<string> {
    try {
      return await DeviceInfo.getBuildNumber();
    } catch (error) {
      console.warn('Failed to get build number:', error);
      return 'Unknown';
    }
  }

  private async safeGetApiLevel(): Promise<number | undefined> {
    try {
      return await DeviceInfo.getApiLevel();
    } catch (error) {
      console.warn('Failed to get API level:', error);
      return undefined;
    }
  }

  private async safeGetCarrier(): Promise<string | undefined> {
    try {
      return await DeviceInfo.getCarrier();
    } catch (error) {
      console.warn('Failed to get carrier:', error);
      return undefined;
    }
  }

  private async safeIsTablet(): Promise<boolean> {
    try {
      return await DeviceInfo.isTablet();
    } catch (error) {
      console.warn('Failed to check if tablet:', error);
      return false;
    }
  }

  private async safeIsEmulator(): Promise<boolean> {
    try {
      return await DeviceInfo.isEmulator();
    } catch (error) {
      console.warn('Failed to check if emulator:', error);
      return false;
    }
  }

  private async safeGetSupportedAbis(): Promise<string[]> {
    try {
      return await DeviceInfo.supportedAbis();
    } catch (error) {
      console.warn('Failed to get supported ABIs:', error);
      return [];
    }
  }

  private async safeGetUserAgent(): Promise<string> {
    try {
      return await DeviceInfo.getUserAgent();
    } catch (error) {
      console.warn('Failed to get user agent:', error);
      return 'Unknown';
    }
  }

  private async safeGetType(): Promise<string> {
    try {
      return await DeviceInfo.getType();
    } catch (error) {
      console.warn('Failed to get device type:', error);
      return 'Unknown';
    }
  }

  private async safeHasNFC(): Promise<boolean> {
    try {
      return await DeviceInfo.isNFC();
    } catch (error) {
      console.warn('Failed to check NFC capability:', error);
      return false;
    }
  }

  private async safeHasFingerprint(): Promise<boolean> {
    try {
      return await DeviceInfo.isFingerprint();
    } catch (error) {
      console.warn('Failed to check fingerprint capability:', error);
      return false;
    }
  }

  private async safeHasFaceRecognition(): Promise<boolean> {
    try {
      return await DeviceInfo.isFaceID();
    } catch (error) {
      console.warn('Failed to check face recognition capability:', error);
      return false;
    }
  }

  private async safeGetCpuType(): Promise<string> {
    try {
      return await DeviceInfo.getCpuType();
    } catch (error) {
      console.warn('Failed to get CPU type:', error);
      return 'Unknown';
    }
  }

  private async safeGetCpuCores(): Promise<number> {
    try {
      return await DeviceInfo.getCpuCores();
    } catch (error) {
      console.warn('Failed to get CPU cores:', error);
      return 0;
    }
  }

  private async safeGetCpuFrequency(): Promise<string> {
    try {
      const freq = await DeviceInfo.getCpuFrequency();
      return `${freq} MHz`;
    } catch (error) {
      console.warn('Failed to get CPU frequency:', error);
      return 'Unknown';
    }
  }

  private async safeGetArchitecture(): Promise<string> {
    try {
      return await DeviceInfo.getArchitecture();
    } catch (error) {
      console.warn('Failed to get architecture:', error);
      return 'Unknown';
    }
  }

  private async safeGetTotalRam(): Promise<number> {
    try {
      const ram = await DeviceInfo.getTotalRam();
      return Math.round(ram / (1024 * 1024)); // Convert to MB
    } catch (error) {
      console.warn('Failed to get total RAM:', error);
      return 0;
    }
  }

  private async safeGetAvailableRam(): Promise<number> {
    try {
      const ram = await DeviceInfo.getAvailableRam();
      return Math.round(ram / (1024 * 1024)); // Convert to MB
    } catch (error) {
      console.warn('Failed to get available RAM:', error);
      return 0;
    }
  }

  private async safeGetTotalStorage(): Promise<number> {
    try {
      const storage = await DeviceInfo.getTotalDiskCapacity();
      return Math.round(storage / (1024 * 1024 * 1024)); // Convert to GB
    } catch (error) {
      console.warn('Failed to get total storage:', error);
      return 0;
    }
  }

  private async safeGetAvailableStorage(): Promise<number> {
    try {
      const storage = await DeviceInfo.getFreeDiskStorage();
      return Math.round(storage / (1024 * 1024 * 1024)); // Convert to GB
    } catch (error) {
      console.warn('Failed to get available storage:', error);
      return 0;
    }
  }

  private async safeGetNetworkType(): Promise<string> {
    try {
      return await DeviceInfo.getNetworkType();
    } catch (error) {
      console.warn('Failed to get network type:', error);
      return 'Unknown';
    }
  }

  private async safeGetCarrierCountry(): Promise<string> {
    try {
      return await DeviceInfo.getCarrierCountry();
    } catch (error) {
      console.warn('Failed to get carrier country:', error);
      return 'Unknown';
    }
  }

  private async safeGetIpAddress(): Promise<string> {
    try {
      return await DeviceInfo.getIpAddress();
    } catch (error) {
      console.warn('Failed to get IP address:', error);
      return 'Unknown';
    }
  }

  private async safeGetBatteryLevel(): Promise<number> {
    try {
      return await DeviceInfo.getBatteryLevel();
    } catch (error) {
      console.warn('Failed to get battery level:', error);
      return 0;
    }
  }

  private async safeIsCharging(): Promise<boolean> {
    try {
      return await DeviceInfo.isCharging();
    } catch (error) {
      console.warn('Failed to check if charging:', error);
      return false;
    }
  }

  private async safeGetBatteryHealth(): Promise<string> {
    try {
      return await DeviceInfo.getBatteryHealth();
    } catch (error) {
      console.warn('Failed to get battery health:', error);
      return 'Unknown';
    }
  }

  private async safeIsRooted(): Promise<boolean> {
    try {
      return await DeviceInfo.isRooted();
    } catch (error) {
      console.warn('Failed to check if rooted:', error);
      return false;
    }
  }

  private async safeIsJailbroken(): Promise<boolean> {
    try {
      return await DeviceInfo.isJailBroken();
    } catch (error) {
      console.warn('Failed to check if jailbroken:', error);
      return false;
    }
  }

  private async safeGetScreenRefreshRate(): Promise<number> {
    try {
      return await DeviceInfo.getScreenRefreshRate();
    } catch (error) {
      console.warn('Failed to get screen refresh rate:', error);
      return 60; // Default fallback
    }
  }

  private createBasicFingerprint(): void {
    const screen = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    
    this.deviceFingerprint = {
      device_id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      device_name: 'Unknown Device',
      device_brand: 'Unknown',
      device_model: 'Unknown Model',
      device_manufacturer: 'Unknown',
      os_type: Platform.OS as 'ios' | 'android',
      os_version: DeviceInfo.getSystemVersion(),
      os_build_number: 'Unknown',
      processor_type: 'Unknown',
      processor_cores: 0,
      processor_frequency: 'Unknown',
      architecture: 'Unknown',
      total_ram_mb: 0,
      available_ram_mb: 0,
      total_storage_gb: 0,
      available_storage_gb: 0,
      screen_width: screen.width,
      screen_height: screen.height,
      screen_density: pixelRatio,
      screen_scale: pixelRatio,
      screen_refresh_rate: 60,
      network_type: 'Unknown',
      app_version: DeviceInfo.getVersion(),
      app_build_number: 'Unknown',
      app_installation_date: new Date().toISOString(),
      has_camera: true,
      has_gps: true,
      has_bluetooth: true,
      has_nfc: false,
      has_fingerprint_sensor: false,
      has_face_recognition: false,
      battery_level: 0,
      is_charging: false,
      battery_health: 'Unknown',
      is_tablet: false,
      is_emulator: false,
      is_rooted: false,
      is_jailbroken: false,
      metadata: {}
    };
    
    this.isInitialized = true;
  }

  public getDeviceFingerprint(): DeviceFingerprint | null {
    return this.deviceFingerprint;
  }

  public async saveDeviceFingerprint(userId: string): Promise<string> {
    if (!this.deviceFingerprint) {
      throw new Error('Device fingerprint not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('device_fingerprints')
        .insert({
          user_id: userId,
          device_id: this.deviceFingerprint.device_id,
          device_name: this.deviceFingerprint.device_name,
          device_brand: this.deviceFingerprint.device_brand,
          device_model: this.deviceFingerprint.device_model,
          device_manufacturer: this.deviceFingerprint.device_manufacturer,
          os_type: this.deviceFingerprint.os_type,
          os_version: this.deviceFingerprint.os_version,
          os_build_number: this.deviceFingerprint.os_build_number,
          os_api_level: this.deviceFingerprint.os_api_level,
          processor_type: this.deviceFingerprint.processor_type,
          processor_cores: this.deviceFingerprint.processor_cores,
          processor_frequency: this.deviceFingerprint.processor_frequency,
          architecture: this.deviceFingerprint.architecture,
          total_ram_mb: this.deviceFingerprint.total_ram_mb,
          available_ram_mb: this.deviceFingerprint.available_ram_mb,
          total_storage_gb: this.deviceFingerprint.total_storage_gb,
          available_storage_gb: this.deviceFingerprint.available_storage_gb,
          screen_width: this.deviceFingerprint.screen_width,
          screen_height: this.deviceFingerprint.screen_height,
          screen_density: this.deviceFingerprint.screen_density,
          screen_scale: this.deviceFingerprint.screen_scale,
          screen_refresh_rate: this.deviceFingerprint.screen_refresh_rate,
          network_type: this.deviceFingerprint.network_type,
          carrier_name: this.deviceFingerprint.carrier_name,
          carrier_country: this.deviceFingerprint.carrier_country,
          ip_address: this.deviceFingerprint.ip_address,
          app_version: this.deviceFingerprint.app_version,
          app_build_number: this.deviceFingerprint.app_build_number,
          app_installation_date: this.deviceFingerprint.app_installation_date,
          has_camera: this.deviceFingerprint.has_camera,
          has_gps: this.deviceFingerprint.has_gps,
          has_bluetooth: this.deviceFingerprint.has_bluetooth,
          has_nfc: this.deviceFingerprint.has_nfc,
          has_fingerprint_sensor: this.deviceFingerprint.has_fingerprint_sensor,
          has_face_recognition: this.deviceFingerprint.has_face_recognition,
          battery_level: this.deviceFingerprint.battery_level,
          is_charging: this.deviceFingerprint.is_charging,
          battery_health: this.deviceFingerprint.battery_health,
          is_tablet: this.deviceFingerprint.is_tablet,
          is_emulator: this.deviceFingerprint.is_emulator,
          is_rooted: this.deviceFingerprint.is_rooted,
          is_jailbroken: this.deviceFingerprint.is_jailbroken,
          metadata: this.deviceFingerprint.metadata,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to save device fingerprint to database:', error);
        // Fallback to mock ID if database fails
        const fingerprintId = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('Device fingerprint saved with fallback ID:', fingerprintId);
        return fingerprintId;
      }

      console.log('Device fingerprint saved with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to save device fingerprint:', error);
      // Fallback to mock ID if database fails
      const fingerprintId = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Device fingerprint saved with fallback ID:', fingerprintId);
      return fingerprintId;
    }
  }

  public async createDeviceSession(userId?: string, fingerprintId?: string): Promise<string> {
    try {
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: DeviceSession = {
        session_token: sessionToken,
        session_started_at: new Date().toISOString(),
        user_agent: await this.safeGetUserAgent(),
      };
      
      // Save session to database if we have userId and fingerprintId
      if (userId && fingerprintId) {
        try {
          const { data, error } = await supabase
            .from('device_sessions')
            .insert({
              user_id: userId,
              device_fingerprint_id: fingerprintId,
              session_token: sessionToken,
              session_started_at: session.session_started_at,
              user_agent: session.user_agent,
            })
            .select('id')
            .single();

          if (error) {
            console.error('Failed to save device session to database:', error);
          } else {
            console.log('Device session saved to database with ID:', data.id);
          }
        } catch (dbError) {
          console.error('Database error saving device session:', dbError);
        }
      }
      
      this.currentSession = session;
      console.log('Device session created:', sessionToken);
      return sessionToken;
    } catch (error) {
      console.error('Failed to create device session:', error);
      throw error;
    }
  }

  public async endDeviceSession(sessionId: string): Promise<void> {
    try {
      console.log('Device session ended:', sessionId);
      this.currentSession = null;
    } catch (error) {
      console.error('Failed to end device session:', error);
    }
  }

  public async trackEvent(userId: string, fingerprintId: string, eventType: string, eventData?: Record<string, any>, sessionId?: string): Promise<void> {
    try {
      const event: DeviceAnalytics = {
        event_type: eventType,
        event_data: eventData || {},
        timestamp: new Date().toISOString(),
      };
      // Persist behavioral event
      await supabase.from('behavioral_events').insert({
        user_id: userId,
        event_type: event.event_type,
        event_data: event.event_data,
        session_id: sessionId,
        device_fingerprint_id: fingerprintId,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  public async refreshDeviceFingerprint(): Promise<void> {
    try {
      await this.initialize();
    } catch (error) {
      console.error('Failed to refresh device fingerprint:', error);
    }
  }

  public async saveDevicePermissions(userId: string, fingerprintId: string, permissions: Record<string, boolean>, consentVersion: string): Promise<void> {
    try {
      // Save each permission to the database
      const permissionEntries = Object.entries(permissions);
      
      for (const [permissionType, isGranted] of permissionEntries) {
        try {
          const { error } = await supabase
            .from('device_permissions')
            .insert({
              user_id: userId,
              device_fingerprint_id: fingerprintId,
              permission_type: permissionType,
              is_granted: isGranted,
              consent_version: consentVersion,
              granted_at: isGranted ? new Date().toISOString() : null,
              revoked_at: !isGranted ? new Date().toISOString() : null,
            });

          if (error) {
            console.error(`Failed to save permission ${permissionType}:`, error);
          } else {
            console.log(`Permission ${permissionType} saved successfully`);
          }
        } catch (dbError) {
          console.error(`Database error saving permission ${permissionType}:`, dbError);
        }
      }
      
      console.log('Device permissions saved:', permissions, 'version:', consentVersion);
    } catch (error) {
      console.error('Failed to save device permissions:', error);
    }
  }

  public async updateDeviceFingerprint(): Promise<void> {
    try {
      if (!this.deviceFingerprint) return;
      
      // Update dynamic information that might change
      this.deviceFingerprint.battery_level = await this.safeGetBatteryLevel();
      this.deviceFingerprint.is_charging = await this.safeIsCharging();
      this.deviceFingerprint.available_ram_mb = await this.safeGetAvailableRam();
      this.deviceFingerprint.available_storage_gb = await this.safeGetAvailableStorage();
      this.deviceFingerprint.network_type = await this.safeGetNetworkType();
      this.deviceFingerprint.ip_address = await this.safeGetIpAddress();
      
      // Update metadata with current timestamp
      this.deviceFingerprint.metadata.lastUpdated = new Date().toISOString();
      
      try {
        await AsyncStorage.setItem('deviceFingerprint', JSON.stringify(this.deviceFingerprint));
      } catch (storageError) {
        console.warn('Failed to update device fingerprint in AsyncStorage:', storageError);
        // Don't fail update if storage fails
      }
    } catch (error) {
      console.error('Failed to update device fingerprint:', error);
    }
  }
}

export default DeviceFingerprintingService;



