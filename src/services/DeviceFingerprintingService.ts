import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions, PixelRatio } from 'react-native';
import { supabase } from '@/integrations/supabase/client';
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

  /**
   * Initialize device fingerprinting service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if device fingerprint exists in local storage
      const storedFingerprint = await AsyncStorage.getItem('device_fingerprint');
      
      if (storedFingerprint) {
        this.deviceFingerprint = JSON.parse(storedFingerprint);
      } else {
        // Generate new device fingerprint
        this.deviceFingerprint = await this.generateDeviceFingerprint();
        await AsyncStorage.setItem('device_fingerprint', JSON.stringify(this.deviceFingerprint));
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize device fingerprinting:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive device fingerprint
   */
  private async generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    const screen = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();

    // Get device information
    const deviceId = await DeviceInfo.getUniqueId();
    const deviceName = await DeviceInfo.getDeviceName();
    const deviceBrand = await DeviceInfo.getBrand();
    const deviceModel = await DeviceInfo.getModel();
    const deviceManufacturer = await DeviceInfo.getManufacturer();

    // Get OS information
    const osVersion = DeviceInfo.getSystemVersion();
    const osBuildNumber = await DeviceInfo.getBuildNumber();
    const osApiLevel = Platform.OS === 'android' ? await DeviceInfo.getApiLevel() : undefined;

    // Get hardware information
    const processorType = await DeviceInfo.getCpuType();
    const processorCores = await DeviceInfo.getCpuCount();
    const architecture = await DeviceInfo.getArchitecture();

    // Get memory information
    const totalRam = await DeviceInfo.getTotalMemory();
    const availableRam = await DeviceInfo.getFreeMemory();
    const totalStorage = await DeviceInfo.getTotalDiskCapacity();
    const availableStorage = await DeviceInfo.getFreeDiskStorage();

    // Get display information
    const screenRefreshRate = await DeviceInfo.getSupportedAbis();

    // Get network information
    const networkType = await DeviceInfo.getNetworkType();
    const carrierName = await DeviceInfo.getCarrier();

    // Get app information
    const appVersion = DeviceInfo.getVersion();
    const appBuildNumber = DeviceInfo.getBuildNumber();
    const appInstallationDate = await DeviceInfo.getFirstInstallTime();

    // Get device capabilities
    const hasCamera = await DeviceInfo.isCameraPresent();
    const hasGps = await DeviceInfo.isLocationEnabled();
    const hasBluetooth = await DeviceInfo.isBluetoothEnabled();
    const hasNfc = await DeviceInfo.isNFCEnabled();
    const hasFingerprintSensor = await DeviceInfo.isFingerprintSensorPresent();
    const hasFaceRecognition = await DeviceInfo.isFaceRecognitionSupported();

    // Get battery information
    const batteryLevel = await DeviceInfo.getBatteryLevel();
    const isCharging = await DeviceInfo.isPowerConnected();
    const batteryHealth = await DeviceInfo.getBatteryHealth();

    // Get device state
    const isTablet = DeviceInfo.isTablet();
    const isEmulator = await DeviceInfo.isEmulator();
    const isRooted = Platform.OS === 'android' ? await DeviceInfo.isRooted() : false;
    const isJailbroken = Platform.OS === 'ios' ? await DeviceInfo.isJailBroken() : false;

    return {
      device_id: deviceId,
      device_name: deviceName,
      device_brand: deviceBrand,
      device_model: deviceModel,
      device_manufacturer: deviceManufacturer,
      
      os_type: Platform.OS as 'ios' | 'android',
      os_version: osVersion,
      os_build_number: osBuildNumber,
      os_api_level: osApiLevel,
      
      processor_type: processorType,
      processor_cores: processorCores,
      processor_frequency: 'Unknown', // Not directly available
      architecture: architecture,
      
      total_ram_mb: Math.round(totalRam / (1024 * 1024)),
      available_ram_mb: Math.round(availableRam / (1024 * 1024)),
      total_storage_gb: Math.round(totalStorage / (1024 * 1024 * 1024)),
      available_storage_gb: Math.round(availableStorage / (1024 * 1024 * 1024)),
      
      screen_width: Math.round(screen.width),
      screen_height: Math.round(screen.height),
      screen_density: pixelRatio,
      screen_scale: pixelRatio,
      screen_refresh_rate: 60, // Default, may need adjustment
      
      network_type: networkType,
      carrier_name: carrierName,
      carrier_country: undefined,
      ip_address: undefined,
      
      app_version: appVersion,
      app_build_number: appBuildNumber,
      app_installation_date: new Date(appInstallationDate).toISOString(),
      
      has_camera: hasCamera,
      has_gps: hasGps,
      has_bluetooth: hasBluetooth,
      has_nfc: hasNfc,
      has_fingerprint_sensor: hasFingerprintSensor,
      has_face_recognition: hasFaceRecognition,
      
      battery_level: Math.round(batteryLevel * 100),
      is_charging: isCharging,
      battery_health: batteryHealth,
      
      is_tablet: isTablet,
      is_emulator: isEmulator,
      is_rooted: isRooted,
      is_jailbroken: isJailbroken,
      
      metadata: {
        userAgent: await DeviceInfo.getUserAgent(),
        deviceId: await DeviceInfo.getDeviceId(),
        systemName: DeviceInfo.getSystemName(),
        supportedAbis: await DeviceInfo.getSupportedAbis(),
        deviceType: await DeviceInfo.getDeviceType(),
        deviceToken: await DeviceInfo.getDeviceToken(),
        uniqueId: await DeviceInfo.getUniqueId(),
        deviceName: await DeviceInfo.getDeviceName(),
        brand: await DeviceInfo.getBrand(),
        model: await DeviceInfo.getModel(),
        manufacturer: await DeviceInfo.getManufacturer(),
        systemVersion: DeviceInfo.getSystemVersion(),
        buildNumber: await DeviceInfo.getBuildNumber(),
        appVersion: DeviceInfo.getVersion(),
        bundleId: DeviceInfo.getBundleId(),
        applicationName: DeviceInfo.getApplicationName(),
        version: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        appName: DeviceInfo.getApplicationName(),
        bundleId: DeviceInfo.getBundleId(),
        deviceId: await DeviceInfo.getDeviceId(),
        deviceName: await DeviceInfo.getDeviceName(),
        brand: await DeviceInfo.getBrand(),
        model: await DeviceInfo.getModel(),
        manufacturer: await DeviceInfo.getManufacturer(),
        systemVersion: DeviceInfo.getSystemVersion(),
        buildNumber: await DeviceInfo.getBuildNumber(),
        appVersion: DeviceInfo.getVersion(),
        bundleId: DeviceInfo.getBundleId(),
        applicationName: DeviceInfo.getApplicationName(),
        version: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        appName: DeviceInfo.getApplicationName(),
        bundleId: DeviceInfo.getBundleId(),
      }
    };
  }

  /**
   * Generate hash for device fingerprint
   */
  private generateHash(data: string): string {
    // Simple hash function - in production, use a more robust hashing algorithm
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate composite hash from device fingerprint
   */
  private generateCompositeHash(fingerprint: DeviceFingerprint): string {
    const compositeData = [
      fingerprint.device_id,
      fingerprint.device_brand,
      fingerprint.device_model,
      fingerprint.os_type,
      fingerprint.os_version,
      fingerprint.architecture,
      fingerprint.processor_type,
      fingerprint.processor_cores.toString(),
      fingerprint.screen_width.toString(),
      fingerprint.screen_height.toString(),
      fingerprint.screen_density.toString(),
    ].join('|');
    
    return this.generateHash(compositeData);
  }

  /**
   * Save device fingerprint to database
   */
  public async saveDeviceFingerprint(userId: string): Promise<string> {
    if (!this.deviceFingerprint) {
      throw new Error('Device fingerprint not initialized');
    }

    try {
      // Check if device fingerprint already exists
      const { data: existingFingerprint } = await supabase
        .from('device_fingerprints')
        .select('id')
        .eq('device_id', this.deviceFingerprint.device_id)
        .eq('user_id', userId)
        .single();

      if (existingFingerprint) {
        // Update existing fingerprint
        const { data, error } = await supabase
          .from('device_fingerprints')
          .update({
            last_seen_at: new Date().toISOString(),
            battery_level: this.deviceFingerprint.battery_level,
            is_charging: this.deviceFingerprint.is_charging,
            available_ram_mb: this.deviceFingerprint.available_ram_mb,
            available_storage_gb: this.deviceFingerprint.available_storage_gb,
            network_type: this.deviceFingerprint.network_type,
            carrier_name: this.deviceFingerprint.carrier_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingFingerprint.id)
          .select()
          .single();

        if (error) throw error;
        return existingFingerprint.id;
      } else {
        // Insert new fingerprint
        const { data, error } = await supabase
          .from('device_fingerprints')
          .insert({
            user_id: userId,
            ...this.deviceFingerprint,
          })
          .select()
          .single();

        if (error) throw error;

        // Generate and save hash
        const compositeHash = this.generateCompositeHash(this.deviceFingerprint);
        await supabase
          .from('device_fingerprint_hashes')
          .insert({
            device_fingerprint_id: data.id,
            hash_type: 'composite',
            hash_value: compositeHash,
          });

        return data.id;
      }
    } catch (error) {
      console.error('Failed to save device fingerprint:', error);
      throw error;
    }
  }

  /**
   * Create device session
   */
  public async createDeviceSession(
    userId: string, 
    deviceFingerprintId: string
  ): Promise<string> {
    const sessionToken = this.generateHash(Date.now().toString() + userId);
    
    const session: DeviceSession = {
      session_token: sessionToken,
      session_started_at: new Date().toISOString(),
      user_agent: await DeviceInfo.getUserAgent(),
    };

    try {
      const { data, error } = await supabase
        .from('device_sessions')
        .insert({
          user_id: userId,
          device_fingerprint_id: deviceFingerprintId,
          ...session,
        })
        .select()
        .single();

      if (error) throw error;
      
      this.currentSession = session;
      return data.id;
    } catch (error) {
      console.error('Failed to create device session:', error);
      throw error;
    }
  }

  /**
   * End device session
   */
  public async endDeviceSession(sessionId: string): Promise<void> {
    try {
      const sessionEndTime = new Date();
      const sessionStartTime = this.currentSession?.session_started_at 
        ? new Date(this.currentSession.session_started_at) 
        : sessionEndTime;
      
      const sessionDuration = Math.round(
        (sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000
      );

      await supabase
        .from('device_sessions')
        .update({
          session_ended_at: sessionEndTime.toISOString(),
          session_duration_seconds: sessionDuration,
          is_active: false,
        })
        .eq('id', sessionId);

      this.currentSession = null;
    } catch (error) {
      console.error('Failed to end device session:', error);
      throw error;
    }
  }

  /**
   * Track device analytics event
   */
  public async trackEvent(
    userId: string,
    deviceFingerprintId: string,
    eventType: string,
    eventData: Record<string, any> = {},
    sessionId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('device_analytics')
        .insert({
          user_id: userId,
          device_fingerprint_id: deviceFingerprintId,
          event_type: eventType,
          event_data: eventData,
          timestamp: new Date().toISOString(),
          session_id: sessionId,
        });
    } catch (error) {
      console.error('Failed to track device analytics event:', error);
      // Don't throw error for analytics tracking failures
    }
  }

  /**
   * Save device permissions
   */
  public async saveDevicePermissions(
    userId: string,
    deviceFingerprintId: string,
    permissions: Record<string, boolean>,
    consentVersion: string
  ): Promise<void> {
    try {
      const permissionRecords = Object.entries(permissions).map(([type, granted]) => ({
        user_id: userId,
        device_fingerprint_id: deviceFingerprintId,
        permission_type: type,
        is_granted: granted,
        granted_at: granted ? new Date().toISOString() : null,
        consent_version: consentVersion,
      }));

      await supabase
        .from('device_permissions')
        .upsert(permissionRecords, {
          onConflict: 'user_id,device_fingerprint_id,permission_type',
        });
    } catch (error) {
      console.error('Failed to save device permissions:', error);
      throw error;
    }
  }

  /**
   * Get device fingerprint
   */
  public getDeviceFingerprint(): DeviceFingerprint | null {
    return this.deviceFingerprint;
  }

  /**
   * Get current session
   */
  public getCurrentSession(): DeviceSession | null {
    return this.currentSession;
  }

  /**
   * Check if device fingerprinting is initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Refresh device fingerprint (update dynamic data)
   */
  public async refreshDeviceFingerprint(): Promise<void> {
    if (!this.deviceFingerprint) return;

    // Update dynamic information
    this.deviceFingerprint.battery_level = Math.round((await DeviceInfo.getBatteryLevel()) * 100);
    this.deviceFingerprint.is_charging = await DeviceInfo.isPowerConnected();
    this.deviceFingerprint.available_ram_mb = Math.round((await DeviceInfo.getFreeMemory()) / (1024 * 1024));
    this.deviceFingerprint.available_storage_gb = Math.round((await DeviceInfo.getFreeDiskStorage()) / (1024 * 1024 * 1024));
    this.deviceFingerprint.network_type = await DeviceInfo.getNetworkType();
    this.deviceFingerprint.carrier_name = await DeviceInfo.getCarrier();

    // Update local storage
    await AsyncStorage.setItem('device_fingerprint', JSON.stringify(this.deviceFingerprint));
  }
}

export default DeviceFingerprintingService;

