import { supabase } from '../integrations/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppConfig {
  [key: string]: string;
}

export interface AppConfigCategory {
  oauth?: AppConfig;
  api_keys?: AppConfig;
  third_party?: AppConfig;
  supabase?: AppConfig;
  zkme?: AppConfig;
}

export class ConfigurationError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

class AppConfigurationService {
  private static instance: AppConfigurationService;
  private configCache: AppConfig | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
  private readonly CONFIG_CACHE_KEY = 'app_configuration_cache';
  private readonly CONFIG_CACHE_TIMESTAMP_KEY = 'app_configuration_cache_timestamp';

  private constructor() {}

  public static getInstance(): AppConfigurationService {
    if (!AppConfigurationService.instance) {
      AppConfigurationService.instance = new AppConfigurationService();
    }
    return AppConfigurationService.instance;
  }

  /**
   * Get all app configurations from database
   * Throws ConfigurationError if database fetch fails
   */
  public async getAppConfigs(forceRefresh: boolean = false): Promise<AppConfig> {
    // Check cache first
    if (!forceRefresh && this.configCache && (Date.now() - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.configCache;
    }

    try {
      // Try to fetch from database
      const { data, error } = await supabase
        .from('app_configuration')
        .select('config_key, config_value')
        .eq('is_active', true);

      if (error) {
        throw new ConfigurationError(
          `Failed to fetch configuration from database: ${error.message}`,
          error
        );
      }

      if (!data || data.length === 0) {
        throw new ConfigurationError(
          'No active configuration found in database. Please ensure app_configuration table is populated.'
        );
      }

      // Transform database results into config object
      const configs: AppConfig = {};
      data.forEach((row: { config_key: string; config_value: string }) => {
        if (!row.config_value || row.config_value.trim() === '') {
          throw new ConfigurationError(
            `Configuration value for key '${row.config_key}' is empty or invalid.`
          );
        }
        configs[row.config_key] = row.config_value;
      });

      // Validate required configuration keys
      const requiredKeys = [
        'supabase_url',
        'supabase_anon_key',
        'google_client_id',
        'google_client_id_web',
        'gmail_api_key',
        'zkme_mch_no',
        'zkme_api_key'
        // Note: zkme_program_no is optional
      ];

      const missingKeys = requiredKeys.filter(key => !configs[key]);
      if (missingKeys.length > 0) {
        throw new ConfigurationError(
          `Missing required configuration keys: ${missingKeys.join(', ')}`
        );
      }

      // Update cache
      this.configCache = configs;
      this.lastFetchTime = Date.now();

      // Save to AsyncStorage for offline access
      await this.saveConfigsToStorage(configs);

      return configs;
    } catch (error) {
      // If it's already a ConfigurationError, rethrow it
      if (error instanceof ConfigurationError) {
        throw error;
      }

      // Try to load from storage as fallback (only if cache is still valid)
      const cachedConfigs = await this.loadConfigsFromStorage();
      if (cachedConfigs && (Date.now() - this.lastFetchTime) < this.CACHE_DURATION) {
        this.configCache = cachedConfigs;
        return cachedConfigs;
      }
      
      // If cache is expired or doesn't exist, throw error
      throw new ConfigurationError(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  /**
   * Get a specific configuration value
   * For optional configs, this method will try to fetch directly from database
   * if getAppConfigs() fails (e.g., due to missing required configs)
   */
  public async getConfigValue(key: string): Promise<string | null> {
    try {
      const configs = await this.getAppConfigs();
      return configs[key] || null;
    } catch (error) {
      // If getAppConfigs() fails (e.g., missing required configs),
      // try to fetch the specific key directly from database
      // This allows optional configs to be read even if required configs are missing
      try {
        const { data, error: dbError } = await supabase
          .from('app_configuration')
          .select('config_value')
          .eq('config_key', key)
          .eq('is_active', true)
          .single();

        if (dbError || !data) {
          return null;
        }

        return data.config_value || null;
      } catch (dbError) {
        // If database query also fails, return null
        return null;
      }
    }
  }

  /**
   * Get configuration by category
   */
  public async getConfigsByCategory(category: 'oauth' | 'api_keys' | 'third_party' | 'supabase' | 'zkme'): Promise<AppConfig> {
    try {
      const { data, error } = await supabase
        .from('app_configuration')
        .select('config_key, config_value')
        .eq('config_category', category)
        .eq('is_active', true);

      if (error) {
        console.warn(`Error fetching ${category} configs:`, error);
        return {};
      }

      const configs: AppConfig = {};
      data?.forEach((row: { config_key: string; config_value: string }) => {
        configs[row.config_key] = row.config_value;
      });

      return configs;
    } catch (error) {
      console.error(`Error fetching ${category} configs:`, error);
      return {};
    }
  }

  /**
   * Get Supabase configuration
   * Throws ConfigurationError if not found
   */
  public async getSupabaseConfig(): Promise<{ url: string; anonKey: string }> {
    const configs = await this.getAppConfigs();
    const url = configs.supabase_url;
    const anonKey = configs.supabase_anon_key;

    if (!url || !anonKey) {
      throw new ConfigurationError('Supabase configuration not found in database');
    }

    return { url, anonKey };
  }

  /**
   * Get Google OAuth configuration
   * Throws ConfigurationError if not found
   */
  public async getGoogleOAuthConfig(): Promise<{
    clientId: string;
    clientIdWeb: string;
    clientIdAndroid: string;
    clientIdIos: string;
  }> {
    const configs = await this.getAppConfigs();
    const clientId = configs.google_client_id;
    const clientIdWeb = configs.google_client_id_web;
    const clientIdAndroid = configs.google_client_id_android || configs.google_client_id;
    const clientIdIos = configs.google_client_id_ios || configs.google_client_id;

    if (!clientId || !clientIdWeb) {
      throw new ConfigurationError('Google OAuth configuration not found in database');
    }

    return {
      clientId,
      clientIdWeb,
      clientIdAndroid,
      clientIdIos,
    };
  }

  /**
   * Get Gmail API key
   * Throws ConfigurationError if not found
   */
  public async getGmailApiKey(): Promise<string> {
    const configs = await this.getAppConfigs();
    const apiKey = configs.gmail_api_key;

    if (!apiKey) {
      throw new ConfigurationError('Gmail API key not found in database');
    }

    return apiKey;
  }

  /**
   * Get ZkMe configuration
   * Throws ConfigurationError if not found
   */
  public async getZkMeConfig(): Promise<{ mchNo: string; apiKey: string }> {
    const configs = await this.getAppConfigs();
    const mchNo = configs.zkme_mch_no;
    const apiKey = configs.zkme_api_key;

    if (!mchNo || !apiKey) {
      throw new ConfigurationError('ZkMe configuration not found in database');
    }

    return { mchNo, apiKey };
  }

  /**
   * Clear configuration cache
   */
  public clearCache(): void {
    this.configCache = null;
    this.lastFetchTime = 0;
    AsyncStorage.removeItem(this.CONFIG_CACHE_KEY);
    AsyncStorage.removeItem(this.CONFIG_CACHE_TIMESTAMP_KEY);
  }

  /**
   * Save configs to AsyncStorage
   */
  private async saveConfigsToStorage(configs: AppConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CONFIG_CACHE_KEY, JSON.stringify(configs));
      await AsyncStorage.setItem(this.CONFIG_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error saving app configs to storage:', error);
    }
  }

  /**
   * Load configs from AsyncStorage
   */
  private async loadConfigsFromStorage(): Promise<AppConfig | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CONFIG_CACHE_KEY);
      const timestamp = await AsyncStorage.getItem(this.CONFIG_CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp, 10);
        // Use cached config if less than cache duration old
        if (cacheAge < this.CACHE_DURATION) {
          return JSON.parse(cached);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading app configs from storage:', error);
      return null;
    }
  }
}

export default AppConfigurationService;

