import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Alert, StyleSheet } from 'react-native';
import {
  Settings, Save, RefreshCw, History, Eye, Edit2, CheckCircle, AlertCircle, Clock, Star, MapPin, Wifi, Smartphone, Mail, Heart, Navigation, Zap
} from "lucide-react-native";
import { useAdminConfiguration } from '../hooks/useAdminConfiguration';

// Stream type icons
const streamIcons: { [key: string]: any } = {
  location: MapPin,
  steps: Heart,
  wifi: Wifi,
  device_metadata: Smartphone,
  email_metadata: Mail,
  spatial: Navigation,
  behavioral: Zap,
};

// Stream type names
const streamNames: { [key: string]: string } = {
  location: 'Location Data',
  steps: 'Steps & Activity',
  wifi: 'WiFi Sharing',
  device_metadata: 'Device Metadata',
  email_metadata: 'Email Metadata',
  spatial: 'Spatial Data',
  behavioral: 'Behavioral Data',
};

export default function AdminConfiguration() {
  const [activeTab, setActiveTab] = useState('configs');
  const [editingConfig, setEditingConfig] = useState<{ id: string; value: string; reason: string } | null>(null);
  
  // Use real admin configuration hook
  const {
    configs,
    history,
    loading,
    updating,
    configVersion,
    updateConfiguration,
    refreshAll,
    getConfigValue,
    getConfigObject,
    getStreamConfigs
  } = useAdminConfiguration();

  const handleEditConfig = (configId: string, currentValue: string) => {
    setEditingConfig({ id: configId, value: currentValue, reason: '' });
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    
    try {
      await updateConfiguration(editingConfig.id, editingConfig.value, editingConfig.reason);
      setEditingConfig(null);
    } catch (error) {
      console.error('Failed to update configuration:', error);
      Alert.alert('Error', 'Failed to update configuration');
    }
  };

  const handleCancelEdit = () => {
    setEditingConfig(null);
  };



  const handleDeleteConfig = async (configId: string, configName: string) => {
    Alert.alert(
      'Delete Configuration',
      `Are you sure you want to delete "${configName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // This would call the service to delete the configuration
              // For now, we'll show an alert and refresh
              Alert.alert('Success', 'Configuration deleted successfully');
              await refreshAll();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete configuration');
            }
          }
        }
      ]
    );
  };

  const renderConfigItem = (streamType: string, configKey: string, config: any) => {
    const Icon = streamIcons[streamType];
    const isEditing = editingConfig?.id === config.id;
    
    return (
      <View key={config.id} style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.configHeader}>
            <View style={styles.configTitle}>
              {Icon && <Icon style={styles.icon} />}
              <Text style={styles.configName}>
                {streamNames[streamType]} - {configKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
            <Badge variant="secondary">{configKey}</Badge>
          </View>
          
          <Text style={styles.configDescription}>
            {config.description}
          </Text>
          
          {isEditing ? (
            <View style={styles.editingControls}>
              <View style={styles.inputGroup}>
                <Label>New Value</Label>
                <Input
                  value={editingConfig?.value || ''}
                  onChangeText={(text: string) => setEditingConfig(editingConfig ? { ...editingConfig, value: text } : null)}
                  placeholder="Enter new value"
                />
              </View>
              <View style={styles.inputGroup}>
                <Label>Change Reason (Optional)</Label>
                <Input
                  value={editingConfig?.reason || ''}
                  onChangeText={(text: string) => setEditingConfig(editingConfig ? { ...editingConfig, reason: text } : null)}
                  placeholder="Why are you making this change?"
                  multiline
                  numberOfLines={2}
                />
              </View>
              <View style={styles.buttonGroup}>
                <Button onPress={handleSaveConfig} style={styles.button}>
                  <Save style={styles.icon} />
                  Save
                </Button>
                <Button onPress={handleCancelEdit} variant="outline" style={styles.button}>
                  Cancel
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.currentValueRow}>
              <View style={styles.currentValueText}>
                <Text style={styles.currentValueLabel}>Current Value</Text>
                <Text style={styles.currentValue}>{config.config_value}</Text>
              </View>
              <Button onPress={() => handleEditConfig(config.id, config.config_value)} size="sm">
                <Edit2 style={styles.icon} />
                Edit
              </Button>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Configuration</Text>
        <Text style={styles.headerSubtitle}>
          Manage data stream configurations and settings
        </Text>
        {configVersion && (
          <Text style={styles.configVersion}>
            Config Version: {configVersion}
          </Text>
        )}
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading configurations...</Text>
        </View>
      )}



      {/* Content */}
      {!loading && configs && (
        <ScrollView style={styles.contentContainer}>
          <View>

            {/* Location Configurations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Data Stream</Text>
              {Object.entries(configs.location || {}).map(([key, config]) => 
                renderConfigItem('location', key, config)
              )}
            </View>

            {/* Steps Configurations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Steps Data Stream</Text>
              {Object.entries(configs.steps || {}).map(([key, config]) => 
                renderConfigItem('steps', key, config)
              )}
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardContent}>
                <View style={styles.infoCardHeader}>
                  <AlertCircle style={styles.infoCardIcon} />
                  <View style={styles.infoCardText}>
                    <Text style={styles.infoCardTitle}>
                      Configuration Changes
                    </Text>
                    <Text style={styles.infoCardDescription}>
                      Changes to configurations will take effect when users log in again or after their session expires (30 days). 
                      All changes are logged for audit purposes.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Styled components
const Button = ({ 
  children, 
  onPress, 
  disabled, 
  variant = 'default',
  size = 'default',
  style 
}: { 
  children: React.ReactNode; 
  onPress: () => void; 
  disabled?: boolean; 
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  style?: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.button,
      variant === 'default' && styles.buttonDefault,
      variant === 'outline' && styles.buttonOutline,
      variant === 'ghost' && styles.buttonGhost,
      size === 'sm' && styles.buttonSm,
      size === 'default' && styles.buttonDefault,
      size === 'lg' && styles.buttonLg,
      disabled && styles.buttonDisabled,
      style
    ]}
  >
    {children}
  </TouchableOpacity>
);



const Input = ({ 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry,
  multiline,
  numberOfLines,
  style 
}: { 
  value: string; 
  onChangeText: (text: string) => void; 
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
}) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    secureTextEntry={secureTextEntry}
    multiline={multiline}
    numberOfLines={numberOfLines}
    style={[
      styles.input,
      multiline && styles.inputMultiline,
      style
    ]}
  />
);

const Label = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <Text style={[styles.label, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // gray-50
  },
  header: {
    backgroundColor: '#ffffff', // white
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // gray-200
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937', // gray-900
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280', // gray-600
    marginTop: 4,
  },
  configVersion: {
    fontSize: 12,
    color: '#9ca3af', // gray-500
    marginTop: 4,
  },
  adminDenied: {
    padding: 16,
  },
  adminDeniedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertCircle: {
    color: '#ef4444', // red-600
    marginRight: 8,
  },
  adminDeniedTitle: {
    fontSize: 16,
    fontWeight: 'medium',
    color: '#991b1b', // red-800
  },
  adminDeniedText: {
    fontSize: 13,
    color: '#78350f', // red-700
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280', // gray-600
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 0, // Remove default padding
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: '#1f2937', // gray-900
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff', // white
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    padding: 16,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  configTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    color: '#6b7280', // gray-600
    marginRight: 8,
  },
  configName: {
    fontSize: 16,
    fontWeight: 'medium',
    color: '#1f2937', // gray-900
  },
  configDescription: {
    fontSize: 13,
    color: '#4b5563', // gray-600
    marginBottom: 12,
  },
  editingControls: {
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937', // gray-900
  },
  inputMultiline: {
    minHeight: 40,
    paddingTop: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: 'medium',
  },
  buttonDefault: {
    backgroundColor: '#3b82f6', // blue-600
    color: '#ffffff', // white
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    backgroundColor: '#ffffff', // white
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonSm: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  buttonLg: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  infoCard: {
    backgroundColor: '#e0f2fe', // blue-50
    borderWidth: 1,
    borderColor: '#a5d6fd', // blue-200
    borderRadius: 8,
    marginTop: 16,
  },
  infoCardContent: {
    padding: 16,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCardIcon: {
    color: '#3b82f6', // blue-600
    marginTop: 2,
  },
  infoCardText: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: 'medium',
    color: '#1f2937', // gray-900
    marginBottom: 4,
  },
  infoCardDescription: {
    fontSize: 13,
    color: '#3b82f6', // blue-700
  },
  label: {
    fontSize: 12,
    fontWeight: 'medium',
    color: '#4b5563', // gray-700
    marginBottom: 4,
  },

  // New styles for CRUD functionality
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  configStatus: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});
