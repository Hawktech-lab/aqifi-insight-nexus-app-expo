import { supabase } from '../integrations/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreamConfig {
  id: string;
  stream_type: string;
  config_key: string;
  config_value: string;
  default_value: string;
  min_value?: string;
  max_value?: string;
  unit?: string;
  description?: string;
  is_editable: boolean;
  is_active: boolean;
  updated_at: string;
}

export interface StreamConfigs {
  [streamType: string]: {
    [configKey: string]: StreamConfig;
  };
}

export interface ConfigChange {
  id: string;
  config_id: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  change_reason?: string;
  created_at: string;
}

class ConfigurationService {
  private static instance: ConfigurationService;
  private configCache: StreamConfigs | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly CONFIG_CACHE_KEY = 'stream_configs_cache';

  private constructor() {}

  public static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  /**
   * Get all stream configurations from database
   */
  public async getStreamConfigs(forceRefresh: boolean = false): Promise<StreamConfigs> {
    // Check cache first
    if (!forceRefresh && this.configCache && (Date.now() - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.configCache;
    }

    try {
      const { data, error } = await supabase
        .from('data_stream_configs')
        .select('*')
        .eq('is_active', true)
        .order('stream_type, config_key');

      if (error) throw error;

      // Transform data into organized structure
      const configs: StreamConfigs = {};
      data?.forEach((config: StreamConfig) => {
        if (!configs[config.stream_type]) {
          configs[config.stream_type] = {};
        }
        configs[config.stream_type][config.config_key] = config;
      });

      // Update cache
      this.configCache = configs;
      this.lastFetchTime = Date.now();

      // Save to AsyncStorage for offline access
      await this.saveConfigsToStorage(configs);

      return configs;
    } catch (error) {
      console.error('Error fetching stream configs:', error);
      
      // Try to load from storage as fallback
      const cachedConfigs = await this.loadConfigsFromStorage();
      if (cachedConfigs) {
        return cachedConfigs;
      }
      
      throw error;
    }
  }

  /**
   * Get configuration for a specific stream type
   */
  public async getStreamConfig(streamType: string): Promise<{ [key: string]: StreamConfig } | null> {
    const configs = await this.getStreamConfigs();
    return configs[streamType] || null;
  }

  /**
   * Get a specific configuration value
   */
  public async getConfigValue(streamType: string, configKey: string): Promise<string | null> {
    const streamConfig = await this.getStreamConfig(streamType);
    return streamConfig?.[configKey]?.config_value || null;
  }

  /**
   * Get configuration value with type conversion
   */
  public async getConfigValueAsNumber(streamType: string, configKey: string): Promise<number | null> {
    const value = await this.getConfigValue(streamType, configKey);
    return value ? parseFloat(value) : null;
  }

  public async getConfigValueAsBoolean(streamType: string, configKey: string): Promise<boolean | null> {
    const value = await this.getConfigValue(streamType, configKey);
    return value ? value.toLowerCase() === 'true' : null;
  }

  /**
   * Update a configuration value (admin only)
   */
  public async updateConfigValue(
    configId: string, 
    newValue: string, 
    changeReason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_stream_configs')
        .update({ 
          config_value: newValue,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', configId);

      if (error) throw error;

      // Clear cache to force refresh
      this.configCache = null;
      this.lastFetchTime = 0;

      console.log(`Configuration updated: ${configId} = ${newValue}`);
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error;
    }
  }

  /**
   * Get configuration change history (admin only)
   */
  public async getConfigHistory(limit: number = 50): Promise<ConfigChange[]> {
    try {
      const { data, error } = await supabase
        .from('config_change_history')
        .select(`
          *,
          data_stream_configs!inner(stream_type, config_key)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching config history:', error);
      throw error;
    }
  }

  /**
   * Get current configuration version hash
   */
  public async getConfigVersion(): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('get_config_version');

      if (error) throw error;
      return data || '';
    } catch (error) {
      console.error('Error getting config version:', error);
      return '';
    }
  }

  /**
   * Check if user session needs config refresh
   */
  public async shouldRefreshConfig(userId: string): Promise<boolean> {
    try {
      // Get current config version
      const currentVersion = await this.getConfigVersion();
      
      // Get user's last config version
      const { data, error } = await supabase
        .from('user_sessions')
        .select('config_version')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const lastVersion = data?.[0]?.config_version;
      return lastVersion !== currentVersion;
    } catch (error) {
      console.error('Error checking config refresh:', error);
      return false;
    }
  }

  /**
   * Update user session with current config version
   */
  public async updateUserConfigVersion(userId: string, sessionToken: string): Promise<void> {
    try {
      const configVersion = await this.getConfigVersion();
      
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: userId,
          session_token: sessionToken,
          config_version: configVersion,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          is_active: true
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user config version:', error);
      throw error;
    }
  }

  /**
   * Clear configuration cache
   */
  public clearCache(): void {
    this.configCache = null;
    this.lastFetchTime = 0;
  }

  /**
   * Save configs to AsyncStorage
   */
  private async saveConfigsToStorage(configs: StreamConfigs): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CONFIG_CACHE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Error saving configs to storage:', error);
    }
  }

  /**
   * Load configs from AsyncStorage
   */
  private async loadConfigsFromStorage(): Promise<StreamConfigs | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CONFIG_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error loading configs from storage:', error);
      return null;
    }
  }

  /**
   * Get default configurations for a stream type
   */
  public getDefaultConfigs(streamType: string): { [key: string]: any } {
    const defaults: { [key: string]: { [key: string]: any } } = {
      location: {
        update_interval: 300000,
        distance_filter: 100,
        accuracy: 'balanced',
        background_updates: false,
        earnings_rate: 0.005
      },
      steps: {
        sync_interval: 900000,
        earnings_rate: 0.001
      },
      wifi: {
        scan_interval: 600000,
        earnings_rate: 0.001
      },
      device_metadata: {
        sync_interval: 86400000,
        earnings_rate: 0.002
      },
      email_metadata: {
        sync_interval: 3600000,
        earnings_rate: 0.003
      },
      spatial: {
        update_interval: 600000,
        earnings_rate: 0.002
      },
      behavioral: {
        sync_interval: 1800000,
        earnings_rate: 0.004
      }
    };

    return defaults[streamType] || {};
  }
}

export default ConfigurationService;
