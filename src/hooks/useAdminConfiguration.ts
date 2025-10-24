import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ConfigurationService, { StreamConfigs, ConfigChange } from '../services/ConfigurationService';
import { useToast } from '../components/ui/use-toast';

export function useAdminConfiguration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const configService = ConfigurationService.getInstance();
  
  const [configs, setConfigs] = useState<StreamConfigs>({});
  const [history, setHistory] = useState<ConfigChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [configVersion, setConfigVersion] = useState<string>('');

  useEffect(() => {
    loadConfigurations();
    loadConfigHistory();
    loadConfigVersion();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const configs = await configService.getStreamConfigs(true); // Force refresh
      setConfigs(configs || {});
    } catch (error) {
      console.error('Error loading configurations:', error);
      setConfigs({}); // Set empty object instead of leaving undefined
      Alert.alert('Error', 'Failed to load configurations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigHistory = async () => {
    try {
      const history = await configService.getConfigHistory(50);
      setHistory(history || []);
    } catch (error) {
      console.error('Error loading config history:', error);
      setHistory([]); // Set empty array instead of leaving undefined
    }
  };

  const loadConfigVersion = async () => {
    try {
      const version = await configService.getConfigVersion();
      setConfigVersion(version || '');
    } catch (error) {
      console.error('Error loading config version:', error);
      setConfigVersion(''); // Set empty string instead of leaving undefined
    }
  };

  const updateConfiguration = async (
    configId: string,
    newValue: string,
    changeReason?: string
  ) => {
    try {
      setUpdating(true);
      await configService.updateConfigValue(configId, newValue, changeReason);
      
      // Reload configurations
      await loadConfigurations();
      await loadConfigHistory();
      await loadConfigVersion();
      
      toast({
        title: "Success",
        description: "Configuration updated successfully.",
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getConfigValue = (streamType: string, configKey: string): string | null => {
    return configs[streamType]?.[configKey]?.config_value || null;
  };

  const getConfigObject = (streamType: string, configKey: string) => {
    return configs[streamType]?.[configKey] || null;
  };

  const getStreamConfigs = (streamType: string) => {
    return configs[streamType] || {};
  };

  const refreshAll = async () => {
    await Promise.all([
      loadConfigurations(),
      loadConfigHistory(),
      loadConfigVersion()
    ]);
  };



  return {
    // State
    configs,
    history,
    loading,
    updating,
    configVersion,
    
    // Actions
    updateConfiguration,
    refreshAll,
    loadConfigurations,
    loadConfigHistory,
    
    // Helpers
    getConfigValue,
    getConfigObject,
    getStreamConfigs,
  };
}
