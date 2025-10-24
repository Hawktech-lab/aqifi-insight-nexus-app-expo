import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import { useDeviceFingerprinting } from '../contexts/DeviceFingerprintingContext';
import { useDeviceAnalytics } from '../hooks/useDeviceAnalytics';
import { 
  Shield, 
  Smartphone, 
  Database, 
  Star, 
  Eye,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';

interface DeviceFingerprintingConsentProps {
  onConsent: (permissions: Record<string, boolean>) => void;
  onDecline: () => void;
}

const DeviceFingerprintingConsent: React.FC<DeviceFingerprintingConsentProps> = ({
  onConsent,
  onDecline,
}) => {
  const [permissions, setPermissions] = useState({
    device_data: false,
    analytics: false,
    monetization: false,
  });

  const { saveDevicePermissions } = useDeviceFingerprinting();
  const { trackUserAction } = useDeviceAnalytics();

  const handlePermissionToggle = (permissionType: keyof typeof permissions) => {
    setPermissions(prev => ({
      ...prev,
      [permissionType]: !prev[permissionType],
    }));
  };

  const handleAccept = async () => {
    trackUserAction('accept_device_fingerprinting', { permissions });
    
    try {
      await saveDevicePermissions(permissions, '1.0.0');
      onConsent(permissions);
    } catch (error) {
      Alert.alert('Error', 'Failed to save permissions. Please try again.');
    }
  };

  const handleDecline = () => {
    trackUserAction('decline_device_fingerprinting');
    onDecline();
  };

  const allPermissionsAccepted = Object.values(permissions).every(Boolean);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Shield size={32} color="#007AFF" />
        <Text style={styles.title}>Device Data Collection</Text>
        <Text style={styles.subtitle}>
          We collect device information to improve your experience and provide personalized services
        </Text>
      </View>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Smartphone size={20} className="mr-2" />
            What We Collect
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>Device Information</Text>
            <Text style={styles.infoDescription}>
              Device model, operating system, hardware specifications, and capabilities
            </Text>
          </View>
          <Separator className="my-2" />
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>Usage Analytics</Text>
            <Text style={styles.infoDescription}>
              App usage patterns, feature interactions, and performance metrics
            </Text>
          </View>
          <Separator className="my-2" />
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>Monetization Data</Text>
            <Text style={styles.infoDescription}>
              Device profile for targeted advertising and revenue optimization
            </Text>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Database size={20} className="mr-2" />
            How We Use Your Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#28a745" />
            <Text style={styles.benefitText}>Personalize your experience</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#28a745" />
            <Text style={styles.benefitText}>Improve app performance</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#28a745" />
            <Text style={styles.benefitText}>Provide relevant content</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#28a745" />
            <Text style={styles.benefitText}>Generate revenue for better services</Text>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Star size={20} className="mr-2" />
            Points Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.monetizationText}>
            By allowing device data collection, you help us generate revenue through:
          </Text>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#28a745" />
            <Text style={styles.benefitText}>Targeted advertising</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#28a745" />
            <Text style={styles.benefitText}>Data licensing to partners</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#28a745" />
            <Text style={styles.benefitText}>Market research insights</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#28a745" />
            <Text style={styles.benefitText}>Enhanced user rewards</Text>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <Eye size={20} className="mr-2" />
            Your Privacy Rights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.rightsItem}>
            <Text style={styles.rightsTitle}>Control Your Data</Text>
            <Text style={styles.rightsDescription}>
              You can modify or revoke permissions at any time in settings
            </Text>
          </View>
          <View style={styles.rightsItem}>
            <Text style={styles.rightsTitle}>Data Security</Text>
            <Text style={styles.rightsDescription}>
              All data is encrypted and stored securely using industry standards
            </Text>
          </View>
          <View style={styles.rightsItem}>
            <Text style={styles.rightsTitle}>No Personal Information</Text>
            <Text style={styles.rightsDescription}>
              We do not collect personal information like names, emails, or phone numbers
            </Text>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Permission Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.permissionItem}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionTitle}>Device Data Collection</Text>
              <Text style={styles.permissionDescription}>
                Collect device specifications and capabilities
              </Text>
            </View>
            <Checkbox
              checked={permissions.device_data}
              onCheckedChange={() => handlePermissionToggle('device_data')}
            />
          </View>
          
          <Separator className="my-3" />
          
          <View style={styles.permissionItem}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionTitle}>Usage Analytics</Text>
              <Text style={styles.permissionDescription}>
                Track app usage and feature interactions
              </Text>
            </View>
            <Checkbox
              checked={permissions.analytics}
              onCheckedChange={() => handlePermissionToggle('analytics')}
            />
          </View>
          
          <Separator className="my-3" />
          
          <View style={styles.permissionItem}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionTitle}>Monetization</Text>
              <Text style={styles.permissionDescription}>
                Use device data for advertising and revenue generation
              </Text>
            </View>
            <Checkbox
              checked={permissions.monetization}
              onCheckedChange={() => handlePermissionToggle('monetization')}
            />
          </View>
        </CardContent>
      </Card>

      <View style={styles.warningContainer}>
        <AlertCircle size={20} color="#ffc107" />
        <Text style={styles.warningText}>
          Note: Declining permissions may limit app functionality and reduce potential earnings
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <Button 
          onPress={handleAccept}
          disabled={!allPermissionsAccepted}
          className="mb-3"
        >
          Accept All Permissions
        </Button>
        
        <Button 
          variant="outline" 
          onPress={handleDecline}
        >
          Decline
        </Button>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By accepting, you agree to our Terms of Service and Privacy Policy.
          You can change these settings anytime in the app settings.
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
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
    flex: 1,
  },
  monetizationText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 12,
    lineHeight: 20,
  },
  rightsItem: {
    marginBottom: 16,
  },
  rightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  rightsDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionHeader: {
    flex: 1,
    marginRight: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default DeviceFingerprintingConsent;



