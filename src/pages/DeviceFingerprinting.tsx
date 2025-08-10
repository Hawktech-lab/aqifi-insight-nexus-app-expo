import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDeviceFingerprinting } from '@/contexts/DeviceFingerprintingContext';
import { useDeviceAnalytics } from '@/hooks/useDeviceAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  Cpu, 
  Memory, 
  Monitor, 
  Wifi, 
  Battery, 
  Shield, 
  Activity,
  RefreshCw,
  Database,
  Eye,
  EyeOff,
} from 'lucide-react-native';

const DeviceFingerprinting: React.FC = () => {
  const {
    deviceFingerprint,
    isInitialized,
    isLoading,
    error,
    refreshDeviceFingerprint,
    saveDevicePermissions,
  } = useDeviceFingerprinting();

  const {
    trackScreenView,
    trackFeatureUsage,
    trackDeviceState,
  } = useDeviceAnalytics();

  useEffect(() => {
    trackScreenView('DeviceFingerprinting');
  }, [trackScreenView]);

  const handleRefresh = async () => {
    trackFeatureUsage('refresh_device_fingerprint');
    await refreshDeviceFingerprint();
    trackDeviceState();
  };

  const handleTogglePermission = async (permissionType: string, currentValue: boolean) => {
    trackFeatureUsage('toggle_device_permission', { permission_type: permissionType, new_value: !currentValue });
    
    try {
      await saveDevicePermissions({
        [permissionType]: !currentValue,
      }, '1.0.0');
      
      Alert.alert('Success', `Permission ${permissionType} ${!currentValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update permission');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMB = (mb: number): string => {
    return `${mb} MB`;
  };

  const formatGB = (gb: number): string => {
    return `${gb} GB`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading device information...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button onPress={handleRefresh} className="mt-4">
          <RefreshCw size={16} className="mr-2" />
          Retry
        </Button>
      </View>
    );
  }

  if (!deviceFingerprint) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No device information available</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Device Fingerprinting</Text>
        <Text style={styles.subtitle}>Comprehensive device information and analytics</Text>
      </View>

      {/* Device Information */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Smartphone size={20} className="mr-2" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Device Name:</Text>
            <Text style={styles.value}>{deviceFingerprint.device_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Brand:</Text>
            <Text style={styles.value}>{deviceFingerprint.device_brand}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Model:</Text>
            <Text style={styles.value}>{deviceFingerprint.device_model}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Manufacturer:</Text>
            <Text style={styles.value}>{deviceFingerprint.device_manufacturer}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Device ID:</Text>
            <Text style={styles.value} numberOfLines={1}>{deviceFingerprint.device_id}</Text>
          </View>
        </CardContent>
      </Card>

      {/* Operating System */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Shield size={20} className="mr-2" />
            Operating System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.label}>OS Type:</Text>
            <Badge variant={deviceFingerprint.os_type === 'ios' ? 'default' : 'secondary'}>
              {deviceFingerprint.os_type.toUpperCase()}
            </Badge>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>OS Version:</Text>
            <Text style={styles.value}>{deviceFingerprint.os_version}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Build Number:</Text>
            <Text style={styles.value}>{deviceFingerprint.os_build_number}</Text>
          </View>
          {deviceFingerprint.os_api_level && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>API Level:</Text>
              <Text style={styles.value}>{deviceFingerprint.os_api_level}</Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Hardware Specifications */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Cpu size={20} className="mr-2" />
            Hardware Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Processor:</Text>
            <Text style={styles.value}>{deviceFingerprint.processor_type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Cores:</Text>
            <Text style={styles.value}>{deviceFingerprint.processor_cores}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Architecture:</Text>
            <Text style={styles.value}>{deviceFingerprint.architecture}</Text>
          </View>
        </CardContent>
      </Card>

      {/* Memory Information */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Memory size={20} className="mr-2" />
            Memory & Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Total RAM:</Text>
            <Text style={styles.value}>{formatMB(deviceFingerprint.total_ram_mb)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Available RAM:</Text>
            <Text style={styles.value}>{formatMB(deviceFingerprint.available_ram_mb)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Total Storage:</Text>
            <Text style={styles.value}>{formatGB(deviceFingerprint.total_storage_gb)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Available Storage:</Text>
            <Text style={styles.value}>{formatGB(deviceFingerprint.available_storage_gb)}</Text>
          </View>
        </CardContent>
      </Card>

      {/* Display Information */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Monitor size={20} className="mr-2" />
            Display
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Resolution:</Text>
            <Text style={styles.value}>{deviceFingerprint.screen_width} × {deviceFingerprint.screen_height}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Density:</Text>
            <Text style={styles.value}>{deviceFingerprint.screen_density.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Scale:</Text>
            <Text style={styles.value}>{deviceFingerprint.screen_scale.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Refresh Rate:</Text>
            <Text style={styles.value}>{deviceFingerprint.screen_refresh_rate} Hz</Text>
          </View>
        </CardContent>
      </Card>

      {/* Network Information */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Wifi size={20} className="mr-2" />
            Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Network Type:</Text>
            <Text style={styles.value}>{deviceFingerprint.network_type}</Text>
          </View>
          {deviceFingerprint.carrier_name && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Carrier:</Text>
              <Text style={styles.value}>{deviceFingerprint.carrier_name}</Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Battery Information */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Battery size={20} className="mr-2" />
            Battery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Level:</Text>
            <Text style={styles.value}>{deviceFingerprint.battery_level}%</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Charging:</Text>
            <Badge variant={deviceFingerprint.is_charging ? 'default' : 'secondary'}>
              {deviceFingerprint.is_charging ? 'Yes' : 'No'}
            </Badge>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Health:</Text>
            <Text style={styles.value}>{deviceFingerprint.battery_health}</Text>
          </View>
        </CardContent>
      </Card>

      {/* Device Capabilities */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Activity size={20} className="mr-2" />
            Device Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.capabilitiesGrid}>
            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityLabel}>Camera</Text>
              <Badge variant={deviceFingerprint.has_camera ? 'default' : 'secondary'}>
                {deviceFingerprint.has_camera ? 'Yes' : 'No'}
              </Badge>
            </View>
            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityLabel}>GPS</Text>
              <Badge variant={deviceFingerprint.has_gps ? 'default' : 'secondary'}>
                {deviceFingerprint.has_gps ? 'Yes' : 'No'}
              </Badge>
            </View>
            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityLabel}>Bluetooth</Text>
              <Badge variant={deviceFingerprint.has_bluetooth ? 'default' : 'secondary'}>
                {deviceFingerprint.has_bluetooth ? 'Yes' : 'No'}
              </Badge>
            </View>
            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityLabel}>NFC</Text>
              <Badge variant={deviceFingerprint.has_nfc ? 'default' : 'secondary'}>
                {deviceFingerprint.has_nfc ? 'Yes' : 'No'}
              </Badge>
            </View>
            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityLabel}>Fingerprint</Text>
              <Badge variant={deviceFingerprint.has_fingerprint_sensor ? 'default' : 'secondary'}>
                {deviceFingerprint.has_fingerprint_sensor ? 'Yes' : 'No'}
              </Badge>
            </View>
            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityLabel}>Face Recognition</Text>
              <Badge variant={deviceFingerprint.has_face_recognition ? 'default' : 'secondary'}>
                {deviceFingerprint.has_face_recognition ? 'Yes' : 'No'}
              </Badge>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Device State */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Database size={20} className="mr-2" />
            Device State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.capabilitiesGrid}>
            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityLabel}>Tablet</Text>
              <Badge variant={deviceFingerprint.is_tablet ? 'default' : 'secondary'}>
                {deviceFingerprint.is_tablet ? 'Yes' : 'No'}
              </Badge>
            </View>
            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityLabel}>Emulator</Text>
              <Badge variant={deviceFingerprint.is_emulator ? 'destructive' : 'secondary'}>
                {deviceFingerprint.is_emulator ? 'Yes' : 'No'}
              </Badge>
            </View>
            <View style={styles.capabilityItem}>
              <Text style={styles.capabilityLabel}>Rooted/Jailbroken</Text>
              <Badge variant={(deviceFingerprint.is_rooted || deviceFingerprint.is_jailbroken) ? 'destructive' : 'secondary'}>
                {(deviceFingerprint.is_rooted || deviceFingerprint.is_jailbroken) ? 'Yes' : 'No'}
              </Badge>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Smartphone size={20} className="mr-2" />
            App Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Version:</Text>
            <Text style={styles.value}>{deviceFingerprint.app_version}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Build Number:</Text>
            <Text style={styles.value}>{deviceFingerprint.app_build_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Installation Date:</Text>
            <Text style={styles.value}>
              {new Date(deviceFingerprint.app_installation_date).toLocaleDateString()}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button onPress={handleRefresh} className="mb-2">
          <RefreshCw size={16} className="mr-2" />
          Refresh Device Info
        </Button>
        
        <Button 
          variant="outline" 
          onPress={() => trackDeviceState()}
          className="mb-2"
        >
          <Activity size={16} className="mr-2" />
          Track Device State
        </Button>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Device fingerprinting is enabled for analytics and monetization purposes.
          All data is collected with user consent and stored securely.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    color: '#6c757d',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    color: '#dc3545',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#212529',
    flex: 2,
    textAlign: 'right',
  },
  capabilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  capabilityItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  capabilityLabel: {
    fontSize: 14,
    color: '#495057',
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default DeviceFingerprinting;

