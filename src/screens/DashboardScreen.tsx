import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useNavigation } from '@react-navigation/native';
import WaitlistService from '../services/WaitlistService';
import { dashboardStyles } from '../styles/dashboardStyles';

export const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const nav = useNavigation();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessStatus, setAccessStatus] = useState<{
    referralCount: number;
    threshold: number;
    remaining: number;
  } | null>(null);
  const userName = profile?.first_name || user?.email?.split('@')[0] || 'User';

  // Check access on mount
  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id) {
        setCheckingAccess(false);
        return;
      }

      try {
        const waitlistService = WaitlistService.getInstance();
        const status = await waitlistService.getAccessStatus(user.id);
        
        setAccessStatus(status);
        setHasAccess(status.hasAccess);
        
        if (!status.hasAccess) {
          // Redirect to waitlist screen if no access
          setTimeout(() => {
            (nav as any).replace('Waitlist');
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        // On error, allow access (fail open)
        setHasAccess(true);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user?.id, nav]);

  // Show loading while checking access
  if (checkingAccess) {
    return (
      <View style={dashboardStyles.container}>
        <View style={dashboardStyles.content}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={dashboardStyles.loadingText}>Checking access...</Text>
        </View>
      </View>
    );
  }

  // Show message if access not granted
  if (!hasAccess && accessStatus) {
    return (
      <View style={dashboardStyles.container}>
        <View style={dashboardStyles.content}>
          <Icon name="lock-closed" size={64} color="#ef4444" />
          <Text style={dashboardStyles.title}>Access Restricted</Text>
          <Text style={dashboardStyles.message}>
            You need to refer {accessStatus.remaining} more {accessStatus.remaining === 1 ? 'person' : 'people'} to access the dashboard.
          </Text>
          <Text style={dashboardStyles.message}>
            Current referrals: {accessStatus.referralCount} / {accessStatus.threshold}
          </Text>
          <TouchableOpacity
            style={dashboardStyles.button}
            onPress={() => (nav as any).navigate('Waitlist')}
          >
            <Text style={dashboardStyles.buttonText}>Go to Waitlist</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={dashboardStyles.container}>
      {/* Header with profile icon/name in top right */}
      <View style={dashboardStyles.header}>
        <View style={dashboardStyles.headerSpacer} />
        <TouchableOpacity 
          style={dashboardStyles.profileButton}
          onPress={() => navigation.navigate('Settings')}
        >
          {profile?.avatar_url ? (
            <Image 
              source={{ uri: profile.avatar_url }} 
              style={dashboardStyles.profileAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={dashboardStyles.profileAvatarPlaceholder}>
              <Text style={dashboardStyles.profileAvatarText}>
                {profile?.first_name?.[0] || user?.email?.[0] || 'U'}
              </Text>
            </View>
          )}
          <Text style={dashboardStyles.profileName}>{userName}</Text>
        </TouchableOpacity>
      </View>

      <View style={dashboardStyles.content}>
        <View style={dashboardStyles.iconContainer}>
          <Icon name="home" size={64} color="#007AFF" />
        </View>
        <Text style={dashboardStyles.title}>Welcome, {userName}!</Text>
        <Text style={dashboardStyles.message}>
          Your dashboard is coming soon. We're working hard to bring you an amazing experience.
        </Text>
        <View style={dashboardStyles.info}>
          <Icon name="information-circle-outline" size={20} color="#6b7280" />
          <Text style={dashboardStyles.infoText}>
            Check back soon for updates and new features.
          </Text>
        </View>
      </View>
    </View>
  );
};
