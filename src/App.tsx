import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DeviceFingerprintingProvider, useDeviceFingerprinting } from './contexts/DeviceFingerprintingContext';

import { supabase } from './integrations/supabase/client';
import Icon from 'react-native-vector-icons/Ionicons';
import Admin from './pages/Admin';
import { useLocationData } from './hooks/useLocationData';
import { useEmailMetadata } from './hooks/useEmailMetadata';
import { useEmailAutoCollection } from './hooks/useEmailAutoCollection';
import RealGmailAuthService from './services/RealGmailAuthService';
import EmailAutoCollectionService from './services/EmailAutoCollectionService';
import LocationDataService from './services/LocationDataService';
import BehavioralAnalyticsService from './services/BehavioralAnalyticsService';
import GmailAuthTest from './utils/GmailAuthTest';
import GoogleSignInDiagnostic from './utils/GoogleSignInDiagnostic';

// TypeScript declaration for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}
import { useSpatialData } from './hooks/useSpatialData';
import { useBehavioralAnalytics } from './hooks/useBehavioralAnalytics';
//import LocationDataService from './services/LocationDataService';
import SpatialDataService from './services/SpatialDataService';
//import BehavioralAnalyticsService from './services/BehavioralAnalyticsService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Measure time-to-ready
const appStartMs = Date.now();

// Data fetching hooks matching the original React app
const useProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user,
    retry: 1,
  });
};

const useDataStreams = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['data-streams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('data_streams')
        .select('*')
        .eq('user_id', user.id)
        .order('stream_type');
      
      if (error) {
        console.error('Error fetching data streams:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
    retry: 1,
  });
};

const useEarnings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['earnings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('earnings_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching earnings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
    retry: 1,
  });
};

const useSurveys = () => {
  return useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching surveys:', error);
        return [];
      }
      return data || [];
    },
    retry: 1,
  });
};

const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
      return data || [];
    },
    retry: 1,
  });
};

const useUserProgress = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user) return { surveys: [], tasks: [] };
      
      const [surveyProgress, taskProgress] = await Promise.all([
        supabase
          .from('user_surveys')
          .select('survey_id, status, completed_at')
          .eq('user_id', user.id),
        supabase
          .from('user_tasks')
          .select('task_id, status, completed_at')
          .eq('user_id', user.id)
      ]);

      return {
        surveys: surveyProgress.data || [],
        tasks: taskProgress.data || []
      };
    },
    enabled: !!user,
    retry: 1,
  });
};

// Admin role checking hook
const useAdminCheck = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  
  return {
    isAdmin: profile?.role === 'admin',
    loading: !profile && !!user
  };
};

// Login Screen
const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        Alert.alert('Login Failed', error.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.authContainer}>
        <View style={styles.authHeader}>
          <Icon name="shield" size={60} color="#007AFF" />
          <Text style={styles.authTitle}>Aqifi Insight Nexus</Text>
          <Text style={styles.authSubtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.authForm}>
          <View style={styles.inputContainer}>
            <Icon name="mail" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Sign Up Screen
const SignUpScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password, firstName, lastName);
      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      } else {
        Alert.alert('Success', 'Account created! Please check your email to verify your account.');
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.authContainer}>
        <View style={styles.authHeader}>
          <Icon name="shield" size={60} color="#007AFF" />
          <Text style={styles.authTitle}>Create Account</Text>
          <Text style={styles.authSubtitle}>Join Aqifi Insight Nexus</Text>
        </View>

        <View style={styles.authForm}>
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="mail" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Dashboard Screen matching original React app
const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: dataStreams } = useDataStreams();
  const { data: transactions } = useEarnings();

  const isGmailUser = user?.email?.endsWith('@gmail.com') || false;
  
  // Filter streams based on Gmail user status (same logic as Activity screen)
  const filteredStreams = (dataStreams || []).filter((stream: any) => {
    if (['wifi', 'device_metadata', 'steps'].includes(stream.stream_type)) return false;
    if (stream.stream_type === 'email_metadata') return isGmailUser;
    return true;
  });
  
  const activeStreams = filteredStreams.filter((stream: any) => stream.is_enabled).length || 0;
  const totalEarnings = profile?.total_earnings || 0;
  const completedSurveys = transactions?.filter((t: any) => t.transaction_type === 'survey').length || 0;
  const profileCompletion = profile?.profile_completion_percentage || 0;
  const userName = profile?.first_name || user?.email?.split('@')[0] || 'User';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.screenTitle}>Welcome back, {userName}</Text>
        <Text style={styles.screenSubtitle}>Here's your data monetization overview</Text>

        {/* KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Icon name="person" size={24} color="#007AFF" />
            <Text style={styles.kpiValue}>{profileCompletion}%</Text>
            <Text style={styles.kpiLabel}>Profile Completion</Text>
            <Text style={styles.kpiSubtitle}>Data Provider Level</Text>
          </View>
          
          <View style={styles.kpiCard}>
            <Icon name="star" size={24} color="#34C759" />
            <Text style={styles.kpiValue}>{totalEarnings.toFixed(0)} pts</Text>
            <Text style={styles.kpiLabel}>Total Points</Text>
            <Text style={styles.kpiSubtitle}>All time</Text>
          </View>
          
          <View style={styles.kpiCard}>
            <Icon name="pulse" size={24} color="#FF9500" />
            <Text style={styles.kpiValue}>{activeStreams}</Text>
            <Text style={styles.kpiLabel}>Active Streams</Text>
            <Text style={styles.kpiSubtitle}>{filteredStreams.length} total available</Text>
          </View>
          
          <View style={styles.kpiCard}>
            <Icon name="trophy" size={24} color="#FFD700" />
            <Text style={styles.kpiValue}>{completedSurveys}</Text>
            <Text style={styles.kpiLabel}>Surveys Complete</Text>
            <Text style={styles.kpiSubtitle}>All time</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Navigate to Settings tab for profile completion
              navigation.navigate('Settings', { initialTab: 'profile' });
            }}
          >
            <Icon name="pulse" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Complete Profile Setup</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Navigate to Surveys tab
              navigation.navigate('Surveys');
            }}
          >
            <Icon name="trophy" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>View Available Missions</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Navigate to Settings tab (data-streams tab is commented out)
              navigation.navigate('Settings');
            }}
          >
            <Icon name="person" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Connect New Data Source</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Activity Screen showing data streams (matching original React app)
const ActivityScreen = () => {
  const { user } = useAuth();
  const isGmailUser = user?.email?.endsWith('@gmail.com') || false;
  const { data: dataStreams, isLoading } = useDataStreams();
  const { isTracking: locationTracking, dataCount: locationDataCount } = useLocationData();
  const { isEnabled: spatialEnabled, dataCount: spatialDataCount } = useSpatialData();
  const { collectEmailMetadata, isCollecting: isEmailCollecting, stats: emailStats, fetchStats: fetchEmailStats, debugEmailCollection } = useEmailMetadata();
  const {
    status: autoCollectionStatus,
    startAutoCollection,
    stopAutoCollection,
    forceCollection,
    handleReauth
  } = useEmailAutoCollection();
  const { 
    isEnabled: behavioralEnabled, 
    dataCount: behavioralDataCount, 
    isAnalyzing,
    analyzeBehavior 
  } = useBehavioralAnalytics();

  // Auth safety: if user is signed out, avoid rendering private content
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Activity & Data Streams</Text>
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>Please sign in to view activity.</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Activity & Data Streams</Text>
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>Loading data streams...</Text>
        </View>
      </View>
    );
  }

  // Filter out wifi, device metadata, steps; include email_metadata only for Gmail users
  const filteredStreams = (dataStreams || []).filter((stream: any) => {
    if (['wifi', 'device_metadata', 'steps'].includes(stream.stream_type)) return false;
    if (stream.stream_type === 'email_metadata') return isGmailUser;
    return true;
  });
  
  const activeStreams = filteredStreams.filter((stream: any) => stream.is_enabled) || [];
  const totalEarnings = filteredStreams.reduce((sum: number, stream: any) => 
    sum + (stream.data_count || 0) * 1, 0 // 1 point per data collected
  ) || 0;
  const pendingStreams = filteredStreams.filter((stream: any) => !stream.is_enabled) || [];

  const getStreamIcon = (streamType: string) => {
    switch (streamType) {
      // Commented out features
      // case 'steps': return 'footsteps';
      // case 'device_metadata': return 'phone-portrait';
      // case 'wifi': return 'wifi';
      case 'email_metadata': return 'mail';
      case 'spatial': return 'navigate';
      case 'location': return 'location';
      case 'behavioral': return 'flash';
      default: return 'pulse';
    }
  };

  const getStreamName = (streamType: string) => {
    switch (streamType) {
      // Commented out features
      // case 'steps': return 'Steps & Activity';
      // case 'device_metadata': return 'Device Metadata';
      // case 'wifi': return 'WiFi Sharing';
      case 'email_metadata': return 'Email Metadata';
      case 'spatial': return 'Spatial Data';
      case 'location': return 'Location Data';
      case 'behavioral': return 'Behavioral Data';
      default: return streamType;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.screenTitle}>Activity & Data Streams</Text>
        <Text style={styles.screenSubtitle}>Real-time view of your connected data sources and earnings</Text>


        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="pulse" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{activeStreams.length}</Text>
            <Text style={styles.statLabel}>Active Streams</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="heart" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{totalEarnings.toFixed(0)} pts</Text>
            <Text style={styles.statLabel}>Potential Earnings</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="time-outline" size={24} color="#FF3B30" />
            <Text style={styles.statNumber}>{pendingStreams.length}</Text>
            <Text style={styles.statLabel}>Pending Setup</Text>
          </View>
        </View>

        {/* Data Streams */}
        <Text style={styles.sectionTitle}>Data Streams</Text>
        {filteredStreams?.map((stream: any) => {
          // Special handling for location, spatial, and behavioral streams to show real-time status
          const isLocationStream = stream.stream_type === 'location';
          const isSpatialStream = stream.stream_type === 'spatial';
          const isBehavioralStream = stream.stream_type === 'behavioral';
          const isEmailMetadataStream = stream.stream_type === 'email_metadata';
          const actualDataCount = isLocationStream ? locationDataCount : 
                                isSpatialStream ? spatialDataCount :
                                isBehavioralStream ? behavioralDataCount :
                                isEmailMetadataStream ? (emailStats?.pointsEarned || 0) :
                                stream.data_count;
          const potentialEarnings = (actualDataCount || 0) * 1; // 1 point per data collected
          const isEnabled = isLocationStream ? (locationTracking || stream.is_enabled) : 
                          isSpatialStream ? (spatialEnabled || stream.is_enabled) :
                          isBehavioralStream ? (behavioralEnabled || stream.is_enabled) : stream.is_enabled;
          
          return (
            <View key={stream.id} style={styles.streamCard}>
              <View style={styles.streamHeader}>
                <View style={styles.streamInfo}>
                  <Icon name={getStreamIcon(stream.stream_type)} size={20} color="#666" />
                  <Text style={styles.streamTitle}>{getStreamName(stream.stream_type)}</Text>
                </View>
                <View style={[styles.statusBadge, isEnabled ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={styles.statusText}>
                    {isLocationStream && locationTracking ? '🟢 tracking' : 
                     isSpatialStream && spatialEnabled ? '🟢 active' : 
                     isBehavioralStream && behavioralEnabled ? (isAnalyzing ? '🟡 analyzing' : '🟢 active') :
                     isEnabled ? 'active' : 'disabled'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.streamDetails}>
                <View style={styles.streamRow}>
                  <Text style={styles.streamLabel}>Earnings Rate</Text>
                  <Text style={styles.streamValue}>1 pt/data</Text>
                </View>
                <View style={styles.streamRow}>
                  <Text style={styles.streamLabel}>Data Points</Text>
                  <Text style={styles.streamValue}>{actualDataCount || 0} collected</Text>
                </View>
                <View style={styles.streamRow}>
                  <Text style={styles.streamLabel}>Potential Earnings</Text>
                  <Text style={styles.streamValue}>{potentialEarnings} pts</Text>
                </View>
                <View style={styles.streamRow}>
                  <Text style={styles.streamLabel}>Last Sync</Text>
                  <Text style={styles.streamValue}>
                    {stream.last_sync_at 
                      ? new Date(stream.last_sync_at).toLocaleDateString()
                      : 'Never'
                    }
                  </Text>
                </View>
              </View>
              
              {!stream.is_enabled && (
                <Text style={styles.streamNote}>
                  Enable this stream in Settings to start earning from your {getStreamName(stream.stream_type).toLowerCase()}
                </Text>
              )}
              
            {/* Email Metadata Collection Section - Only show when stream is enabled */}
            {stream.stream_type === 'email_metadata' && stream.is_enabled && (
              <View style={styles.emailCollectionSection}>
                {/* Auto-Collection Status */}
                {autoCollectionStatus.isRunning && (
                  <View style={styles.autoCollectionStatusActive}>
                    <View style={styles.statusHeader}>
                      <Icon name="checkmark-circle" size={20} color="#34C759" />
                      <Text style={styles.statusTitle}>Auto-Collection Active</Text>
                      <TouchableOpacity 
                        style={styles.stopButton}
                        onPress={stopAutoCollection}
                      >
                        <Text style={styles.stopButtonText}>Stop</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.statusSubtitle}>
                      Collecting every {autoCollectionStatus.config.intervalMinutes} minutes
                    </Text>
                  </View>
                )}
                
                {/* Commented out: Auto-Collection Disabled section - removed as requested */}
                {/* {!autoCollectionStatus.isRunning && (
                  <View style={styles.autoCollectionStatusDisabled}>
                    <View style={styles.statusHeader}>
                      <Icon name="warning" size={20} color="#FF9500" />
                      <Text style={styles.statusTitle}>Auto-Collection Disabled</Text>
                      <TouchableOpacity 
                        style={styles.enableButton}
                        onPress={startAutoCollection}
                      >
                        <Text style={styles.enableButtonText}>Enable</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.statusSubtitle}>
                      Enable to automatically collect emails
                    </Text>
                  </View>
                )} */}

                {/* Re-authentication prompt - only show when session has actually expired */}
                {autoCollectionStatus.needsReauth && autoCollectionStatus.session.consecutiveFailures > 0 && (
                  <View style={styles.reauthPrompt}>
                    <View style={styles.statusHeader}>
                      <Icon name="warning" size={20} color="#FF3B30" />
                      <Text style={styles.statusTitle}>Session Expired</Text>
                      <TouchableOpacity 
                        style={styles.reauthButton}
                        onPress={handleReauth}
                      >
                        <Text style={styles.reauthButtonText}>Re-auth</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.statusSubtitle}>
                      Please re-authenticate to continue auto-collection
                    </Text>
                  </View>
                )}

                {/* Manual Collection and Debug Buttons 
                <View style={styles.manualCollectionSection}>
                  <TouchableOpacity 
                    style={[styles.collectButton, isEmailCollecting && styles.collectButtonDisabled]}
                    onPress={collectEmailMetadata}
                    disabled={isEmailCollecting}
                  >
                    <Icon name="mail" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.collectButtonText}>
                      {isEmailCollecting ? 'Collecting...' : 'Collect Now'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.debugButton}
                    onPress={debugEmailCollection}
                  >
                    <Icon name="bug" size={16} color="#6b7280" style={{ marginRight: 8 }} />
                    <Text style={styles.debugButtonText}>Debug</Text>
                  </TouchableOpacity>
                </View> */}

              </View>
            )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

// Surveys Screen matching original React app (surveys + tasks)
const SurveysScreen = () => {
  const { user } = useAuth();
  const { data: surveys } = useSurveys();
  const { data: tasks } = useTasks();
  const { data: userProgress } = useUserProgress();

  const getSurveyStatus = (surveyId: string) => {
    const progress = userProgress?.surveys?.find((p: any) => p.survey_id === surveyId);
    return progress?.status || 'not_started';
  };

  const getTaskStatus = (taskId: string) => {
    const progress = userProgress?.tasks?.find((p: any) => p.task_id === taskId);
    return progress?.status || 'not_started';
  };

  const startSurvey = async (survey: any) => {
    if (!user) return;

    const existingProgress = userProgress?.surveys?.find((p: any) => p.survey_id === survey.id);
    
    if (!existingProgress) {
      const { error } = await supabase
        .from('user_surveys')
        .insert([{
          user_id: user.id,
          survey_id: survey.id,
          status: 'available'
        }]);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
    }

    Alert.alert('Survey', `Opening survey: ${survey.title}`);
  };

  const markSurveyCompleted = async (surveyId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_surveys')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('survey_id', surveyId);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Survey completed! Points have been awarded.');
    }
  };

  const completeTask = async (taskId: string) => {
    if (!user) return;

    const existingProgress = userProgress?.tasks?.find((p: any) => p.task_id === taskId);
    
    if (!existingProgress) {
      const { error } = await supabase
        .from('user_tasks')
        .insert([{
          user_id: user.id,
          task_id: taskId,
          status: 'completed',
          completed_at: new Date().toISOString()
        }]);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('user_tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('task_id', taskId);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
    }

    Alert.alert('Success', 'Task completed! Points have been awarded.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.screenTitle}>Surveys & Tasks</Text>
        <Text style={styles.screenSubtitle}>Complete surveys and tasks to earn points and rewards</Text>

        {/* Available Surveys */}
        <Text style={styles.sectionTitle}>Available Surveys</Text>
        {surveys?.map((survey: any) => {
          const status = getSurveyStatus(survey.id);
          return (
            <View key={survey.id} style={styles.surveyCard}>
              <View style={styles.surveyHeader}>
                <Text style={styles.surveyTitle}>{survey.title}</Text>
                {status === 'completed' && (
                  <View style={[styles.statusBadge, styles.completedBadge]}>
                    <Icon name="checkmark-circle" size={12} color="#fff" />
                    <Text style={styles.statusText}>Completed</Text>
                  </View>
                )}
                {status === 'available' && (
                  <View style={[styles.statusBadge, styles.inProgressBadge]}>
                    <Icon name="time" size={12} color="#fff" />
                    <Text style={styles.statusText}>In Progress</Text>
                  </View>
                )}
              </View>
              <Text style={styles.surveyDescription}>{survey.description}</Text>
              <View style={styles.surveyRewards}>
                <Icon name="star" size={16} color="#FFD700" />
                <Text style={styles.rewardText}>{survey.reward_points} pts</Text>
              </View>
              <View style={styles.surveyActions}>
                {status === 'not_started' && (
                  <TouchableOpacity style={styles.primaryButton} onPress={() => startSurvey(survey)}>
                    <Text style={styles.buttonText}>Start Survey</Text>
                  </TouchableOpacity>
                )}
                {status === 'available' && (
                  <>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => startSurvey(survey)}>
                      <Text style={styles.buttonText}>Continue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => markSurveyCompleted(survey.id)}>
                      <Text style={styles.buttonText}>Mark Complete</Text>
                    </TouchableOpacity>
                  </>
                )}
                {status === 'completed' && (
                  <TouchableOpacity style={styles.disabledButton} disabled>
                    <Text style={styles.buttonText}>Completed</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Available Tasks */}
        <Text style={styles.sectionTitle}>Available Tasks</Text>
        {tasks?.map((task: any) => {
          const status = getTaskStatus(task.id);
          return (
            <View key={task.id} style={styles.surveyCard}>
              <View style={styles.surveyHeader}>
                <Text style={styles.surveyTitle}>{task.title}</Text>
                {status === 'completed' && (
                  <View style={[styles.statusBadge, styles.completedBadge]}>
                    <Icon name="checkmark-circle" size={12} color="#fff" />
                    <Text style={styles.statusText}>Completed</Text>
                  </View>
                )}
              </View>
              <Text style={styles.surveyDescription}>{task.description}</Text>
              <View style={styles.surveyRewards}>
                <Icon name="star" size={16} color="#FFD700" />
                <Text style={styles.rewardText}>{task.reward_points} pts</Text>
              </View>
              <View style={styles.surveyActions}>
                {status === 'not_started' && (
                  <TouchableOpacity style={styles.primaryButton} onPress={() => completeTask(task.id)}>
                    <Text style={styles.buttonText}>Complete Task</Text>
                  </TouchableOpacity>
                )}
                {status === 'completed' && (
                  <TouchableOpacity style={styles.disabledButton} disabled>
                    <Text style={styles.buttonText}>Completed</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {(!surveys || surveys.length === 0) && (!tasks || tasks.length === 0) && (
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>No surveys or tasks available at the moment. Check back later!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Settings Screen
const SettingsScreen = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: dataStreams, isLoading: streamsLoading } = useDataStreams();
  const [activeTab, setActiveTab] = useState('profile');
  const [collectingData, setCollectingData] = useState(false);
  const [spatialService] = useState(() => SpatialDataService.getInstance());
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  
  // Debug state for Gmail OAuth
  const [gmailDebugInfo, setGmailDebugInfo] = useState<{
    isGmailUser: boolean;
    isSignedIn: boolean;
    lastError: string | null;
    authStatus: string;
    debugLogs: string[];
  }>({
    isGmailUser: false,
    isSignedIn: false,
    lastError: null,
    authStatus: 'Unknown',
    debugLogs: []
  });
  
  // Wallet connection state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);

  // Auth safety: if user is signed out, avoid rendering settings content
  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.screenTitle}>Settings</Text>
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>Please sign in to manage your settings.</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Debug function to update Gmail status
  const updateGmailDebugInfo = async () => {
    try {
      const isGmailUser = user?.email?.endsWith('@gmail.com') || false;
      const gmailAuthService = RealGmailAuthService.getInstance();
      
      let isSignedIn = false;
      try {
        isSignedIn = await gmailAuthService.isSignedIn();
      } catch (signInError) {
        console.log('Error checking sign-in status:', signInError);
        isSignedIn = false;
      }
      
      setGmailDebugInfo(prev => ({
        ...prev,
        isGmailUser,
        isSignedIn,
        authStatus: isSignedIn ? 'Authenticated' : 'Not Authenticated',
        debugLogs: [
          ...prev.debugLogs.slice(-4), // Keep last 5 logs
          `[${new Date().toLocaleTimeString()}] Gmail User: ${isGmailUser}, Signed In: ${isSignedIn}`
        ]
      }));
    } catch (error) {
      setGmailDebugInfo(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        debugLogs: [
          ...prev.debugLogs.slice(-4),
          `[${new Date().toLocaleTimeString()}] Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        ]
      }));
    }
  };

  // Check Gmail status on mount and when user changes
  useEffect(() => {
    updateGmailDebugInfo();
  }, [user]);

  const handleSignOut = async () => {
    try {
      // Best-effort cleanups; do not block app sign-out on failure
      try {
        const autoCollectionService = EmailAutoCollectionService.getInstance();
        autoCollectionService.cleanup();
      } catch (_) {}

      try {
        const locationService = LocationDataService.getInstance();
        if (locationService.cleanup) {
          await locationService.cleanup();
        }
      } catch (_) {}

      try {
        const behavioralService = BehavioralAnalyticsService.getInstance();
        if (behavioralService.cleanup) {
          await behavioralService.cleanup();
        }
      } catch (_) {}

      try {
        const gmailAuthService = RealGmailAuthService.getInstance();
        if (gmailAuthService.signOut) {
          await gmailAuthService.signOut();
        }
      } catch (_) {}
    } finally {
      try {
        await signOut();
      } catch (error) {
        console.error('Sign out error:', error);
        Alert.alert('Error', 'Failed to sign out');
      }
    }
  };

  // MetaMask wallet connection functions
  const connectWallet = async () => {
    setWalletConnecting(true);
    try {
      // Check if MetaMask is available
      if (typeof window !== 'undefined' && window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          Alert.alert('Success', 'Wallet connected successfully!');
        }
      } else {
        Alert.alert('Error', 'MetaMask not detected. Please install MetaMask to connect your wallet.');
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      if (error.code === 4001) {
        Alert.alert('Connection Rejected', 'Please connect your wallet to continue.');
      } else {
        Alert.alert('Connection Error', 'Failed to connect wallet. Please try again.');
      }
    } finally {
      setWalletConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    Alert.alert('Disconnected', 'Wallet has been disconnected.');
  };

  // Photo change functionality
  const changeProfilePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }

      // Show action sheet
      Alert.alert(
        'Change Profile Photo',
        'Choose an option',
        [
          { text: 'Camera', onPress: () => pickImage('camera') },
          { text: 'Photo Library', onPress: () => pickImage('library') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions.');
    }
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };

      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant permission to access your camera.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }

      // Create a unique filename
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        Alert.alert('Upload Error', 'Failed to upload image.');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert('Update Error', 'Failed to update profile.');
        return;
      }

      Alert.alert('Success', 'Profile photo updated successfully!');
      
      // Refresh profile data
      // Note: The useProfile hook should automatically refetch due to the update
      
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image.');
    }
  };

  const triggerDataCollection = async (type: 'all' | 'activity' | 'location') => {
    setCollectingData(true);
    
    try {
      let functionName = '';
      let description = '';
      
      switch (type) {
        case 'activity':
          functionName = 'collect-activity-data';
          description = 'activity data';
          break;
        case 'location':
          functionName = 'collect-location-data';
          description = 'location data';
          break;
        case 'all':
          functionName = 'schedule-data-collection';
          description = 'all data streams';
          break;
      }

      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) {
        throw error;
      }

      Alert.alert(
        "Data Collection Started",
        `Successfully triggered ${description} collection. Check your Activity page for updates.`
      );
      
      console.log('Data collection result:', data);
      
    } catch (error: any) {
      console.error('Data collection error:', error);
      Alert.alert(
        "Error",
        `Failed to trigger data collection: ${error?.message || 'Unknown error'}`
      );
    } finally {
      setCollectingData(false);
    }
  };

  const toggleDataStream = async (streamId: string, enabled: boolean) => {
    console.log(`Toggling stream ${streamId} to ${enabled}`);
    
    // Set loading state for this specific stream
    setLoadingStates(prev => ({ ...prev, [streamId]: true }));
    
    try {
      // Find the stream to check if it's email_metadata
      const stream = dataStreams?.find((s: any) => s.id === streamId);
      
      // If enabling email_metadata, check Gmail authentication first
      if (enabled && stream?.stream_type === 'email_metadata') {
        // Update debug info
        setGmailDebugInfo(prev => ({
          ...prev,
          debugLogs: [
            ...prev.debugLogs.slice(-4),
            `[${new Date().toLocaleTimeString()}] Starting email_metadata stream activation`
          ]
        }));
        
        // Check if user is Gmail user
        if (!user?.email?.endsWith('@gmail.com')) {
          const errorMsg = 'Email metadata collection is only available for Gmail users. Please sign in with your Gmail account.';
          setGmailDebugInfo(prev => ({
            ...prev,
            lastError: errorMsg,
            debugLogs: [
              ...prev.debugLogs.slice(-4),
              `[${new Date().toLocaleTimeString()}] Error: ${errorMsg}`
            ]
          }));
          Alert.alert('Gmail Required', errorMsg);
          return;
        }
        
        // Check if already authenticated with Gmail
        const gmailAuthService = RealGmailAuthService.getInstance();
        let isSignedIn = false;
        
        try {
          isSignedIn = await gmailAuthService.isSignedIn();
          setGmailDebugInfo(prev => ({
            ...prev,
            debugLogs: [
              ...prev.debugLogs.slice(-4),
              `[${new Date().toLocaleTimeString()}] Gmail sign-in check: ${isSignedIn}`
            ]
          }));
        } catch (error) {
          const errorMsg = `Failed to check Gmail sign-in status: ${error instanceof Error ? error.message : 'Unknown error'}`;
          setGmailDebugInfo(prev => ({
            ...prev,
            lastError: errorMsg,
            debugLogs: [
              ...prev.debugLogs.slice(-4),
              `[${new Date().toLocaleTimeString()}] Error: ${errorMsg}`
            ]
          }));
          Alert.alert('Error', errorMsg);
          return;
        }
        
        if (!isSignedIn) {
          // Prompt for Gmail authentication
          const authResult = await new Promise((resolve) => {
            Alert.alert(
              'Gmail Authentication Required',
              'To enable email metadata collection, you need to sign in with your Gmail account. Would you like to sign in now?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => {
                    setGmailDebugInfo(prev => ({
                      ...prev,
                      debugLogs: [
                        ...prev.debugLogs.slice(-4),
                        `[${new Date().toLocaleTimeString()}] Gmail authentication cancelled by user`
                      ]
                    }));
                    resolve(false);
                  }
                },
                {
                  text: 'Sign In',
                  onPress: async () => {
                    try {
                      setGmailDebugInfo(prev => ({
                        ...prev,
                        debugLogs: [
                          ...prev.debugLogs.slice(-4),
                          `[${new Date().toLocaleTimeString()}] Starting Gmail authentication...`
                        ]
                      }));
                      
                      await gmailAuthService.initialize();
                      setGmailDebugInfo(prev => ({
                        ...prev,
                        debugLogs: [
                          ...prev.debugLogs.slice(-4),
                          `[${new Date().toLocaleTimeString()}] Gmail service initialized`
                        ]
                      }));
                      
                      const result = await gmailAuthService.signInWithGmail();
                      
                      setGmailDebugInfo(prev => ({
                        ...prev,
                        lastError: result.success ? null : result.error || 'Authentication failed',
                        debugLogs: [
                          ...prev.debugLogs.slice(-4),
                          `[${new Date().toLocaleTimeString()}] Gmail authentication result: ${result.success ? 'Success' : 'Failed - ' + (result.error || 'Unknown error')}`
                        ]
                      }));
                      
                      if (!result.success) {
                        // Show enhanced error information for developer errors
                        if (result.debugInfo) {
                          Alert.alert(
                            'Authentication Failed', 
                            result.error || 'Failed to sign in with Gmail',
                            [
                              { text: 'OK' },
                              { 
                                text: 'Show Debug Info', 
                                onPress: () => {
                                  const debugText = JSON.stringify(result.debugInfo, null, 2);
                                  Alert.alert('Debug Information', debugText, [{ text: 'OK' }]);
                                }
                              }
                            ]
                          );
                        } else {
                          Alert.alert('Authentication Failed', result.error || 'Failed to sign in with Gmail');
                        }
                      }
                      
                      resolve(result.success);
                    } catch (error) {
                      const errorMsg = `Gmail authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                      setGmailDebugInfo(prev => ({
                        ...prev,
                        lastError: errorMsg,
                        debugLogs: [
                          ...prev.debugLogs.slice(-4),
                          `[${new Date().toLocaleTimeString()}] Error: ${errorMsg}`
                        ]
                      }));
                      Alert.alert('Authentication Error', errorMsg);
                      resolve(false);
                    }
                  }
                }
              ]
            );
          });
          
          if (!authResult) {
            setGmailDebugInfo(prev => ({
              ...prev,
              debugLogs: [
                ...prev.debugLogs.slice(-4),
                `[${new Date().toLocaleTimeString()}] Gmail authentication failed, aborting stream activation`
              ]
            }));
            return;
          }
          
          // Update debug info after successful authentication
          //await updateGmailDebugInfo();
        }
      }
      
      // Update the stream in database
      const { error } = await supabase
        .from('data_streams')
        .update({ is_enabled: enabled })
        .eq('id', streamId);

      if (error) {
        console.error(`Error toggling stream ${streamId}:`, error);
        Alert.alert('Error', 'Failed to update data stream');
      } else {
        // Force a refetch of data streams to update the UI
        queryClient.invalidateQueries(['data-streams', user?.id]);
        console.log(`Successfully toggled stream ${streamId} to ${enabled}`);
        
        // Show success message for email_metadata
        if (stream?.stream_type === 'email_metadata' && enabled) {
          Alert.alert(
            'Email Collection Enabled',
            'Email metadata collection is now active. The app will automatically collect your email headers every 30 minutes.'
          );
        }
      }
    } catch (error) {
      console.error(`Error toggling stream ${streamId}:`, error);
      Alert.alert('Error', 'Failed to update data stream');
    } finally {
      setLoadingStates(prev => ({ ...prev, [streamId]: false }));
    }
  };

  const getStreamIcon = (streamType: string) => {
    switch (streamType) {
      // Commented out features
      // case 'steps': return 'heart';
      // case 'device_metadata': return 'phone-portrait';
      // case 'wifi': return 'wifi';
      case 'email_metadata': return 'mail';
      case 'spatial': return 'navigate';
      case 'location': return 'location';
      case 'behavioral': return 'flash';
      default: return 'pulse';
    }
  };

  const getStreamName = (streamType: string) => {
    switch (streamType) {
      // Commented out features
      // case 'steps': return 'Steps & Activity Tracking';
      // case 'device_metadata': return 'Device Information';
      // case 'wifi': return 'WiFi Network Sharing';
      case 'email_metadata': return 'Email Metadata';
      case 'spatial': return 'Spatial Movement Data';
      case 'location': return 'Location Tracking';
      case 'behavioral': return 'Behavioral Analytics';
      default: return streamType;
    }
  };

  const getStreamDescription = (streamType: string) => {
    switch (streamType) {
      // Commented out features
      // case 'steps': return 'Track your daily steps and physical activity';
      // case 'device_metadata': return 'Share device model, OS version, and technical specs';
      // case 'wifi': return 'Share WiFi network information and connectivity patterns';
      case 'email_metadata': return 'Collect headers only (from/to/subject), no body or attachments';
      case 'spatial': return 'Track spatial movement and orientation data';
      case 'location': return 'Share location data for geographical insights';
      case 'behavioral': return 'Analyze app usage and behavioral patterns';
      default: return 'Data stream';
    }
  };

  const getKYCStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'verified': return '#34C759';
      case 'pending': return '#FF9500';
      case 'rejected': return '#FF3B30';
      default: return '#666';
    }
  };

  const getKYCStatusText = (status: string | null | undefined) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return 'Not Started';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.screenTitle}>Settings</Text>
        <Text style={styles.screenSubtitle}>Manage your profile, connections, and preferences</Text>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'profile' && styles.activeTabButton]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
              Profile & Data
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'kyc' && styles.activeTabButton]}
            onPress={() => setActiveTab('kyc')}
          >
            <Text style={[styles.tabText, activeTab === 'kyc' && styles.activeTabText]}>
              KYC Verification
            </Text>
          </TouchableOpacity>
          {/* <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'collection' && styles.activeTabButton]}
            onPress={() => setActiveTab('collection')}
          >
            <Text style={[styles.tabText, activeTab === 'collection' && styles.activeTabText]}>
              Collection Controls
            </Text>
          </TouchableOpacity> */}
        </View>

        {/* Profile & Data Tab */}
        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            {/* Profile Section */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="person" size={20} color="#007AFF" />
                <Text style={styles.cardTitle}>Identity & Profile</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.profileSection}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      {profile?.avatar_url ? (
                        <Image 
                          source={{ uri: profile.avatar_url }} 
                          style={styles.avatarImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {profile?.first_name?.[0] || user?.email?.[0] || 'U'}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.changePhotoButton} onPress={changeProfilePhoto}>
                      <Text style={styles.changePhotoText}>Change Photo</Text>
                    </TouchableOpacity>
                  </View>
                  
		  {/*
                  <View style={styles.inputRow}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Full Name</Text>
                      <View style={styles.displayValue}>
                        <Text style={styles.displayText}>
                          {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Not set'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Country</Text>
                      <View style={styles.displayValue}>
                        <Text style={styles.displayText}>
                          {profile?.country || 'Not set'}
                        </Text>
                      </View>
                    </View>
                  </View>
		  */}

                  <View style={styles.kycStatusContainer}>
                    <View style={styles.kycStatusInfo}>
                      <Icon name="shield" size={20} color="#007AFF" />
                      <View style={styles.kycStatusText}>
                        <Text style={styles.kycStatusTitle}>KYC Verification</Text>
                        <Text style={styles.kycStatusSubtitle}>
                          {profile?.kyc_status === 'verified' ? 'Identity verified' :
                           profile?.kyc_status === 'pending' ? 'Verification pending' :
                           profile?.kyc_status === 'rejected' ? 'Verification rejected' :
                           'Not started'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.kycBadge, { backgroundColor: getKYCStatusColor(profile?.kyc_status) }]}>
                      <Text style={styles.kycBadgeText}>
                        {getKYCStatusText(profile?.kyc_status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Wallet Connections */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="wallet" size={20} color="#007AFF" />
                <Text style={styles.cardTitle}>Wallet Connections</Text>
              </View>
              <View style={styles.cardContent}>
                {walletConnected ? (
                  <View style={styles.walletConnection}>
                    <View style={styles.walletIcon}>
                      <Icon name="wallet" size={16} color="#fff" />
                    </View>
                    <View style={styles.walletInfo}>
                      <Text style={styles.walletName}>MetaMask Wallet</Text>
                      <Text style={styles.walletAddress}>
                        {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
                      </Text>
                    </View>
                    <View style={styles.connectedBadge}>
                      <Text style={styles.connectedBadgeText}>Connected</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.walletNotConnected}>
                    <View style={styles.walletIcon}>
                      <Icon name="wallet" size={16} color="#666" />
                    </View>
                    <View style={styles.walletInfo}>
                      <Text style={styles.walletName}>No Wallet Connected</Text>
                      <Text style={styles.walletAddress}>Connect your wallet to start earning</Text>
                    </View>
                    <View style={styles.notConnectedBadge}>
                      <Text style={styles.notConnectedBadgeText}>Not Connected</Text>
                    </View>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={[styles.connectWalletButton, walletConnected && styles.disconnectWalletButton]}
                  onPress={walletConnected ? disconnectWallet : connectWallet}
                >
                  <Icon name="wallet" size={16} color={walletConnected ? "#ef4444" : "#007AFF"} />
                  <Text style={[styles.connectWalletText, walletConnected && styles.disconnectWalletText]}>
                    {walletConnected ? 'Disconnect Wallet' : 'Connect MetaMask'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Data Stream Permissions */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="phone-portrait" size={20} color="#007AFF" />
                <Text style={styles.cardTitle}>Data Stream Permissions</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.permissionsDescription}>
                  Control what data you share to earn rewards. Enable the data streams you're comfortable sharing.
                </Text>
                
                {/* Filter out wifi/device/steps; include email only for Gmail users */}
                {(() => {
                  const isGmailUser = user?.email?.endsWith('@gmail.com') || false;
                  return (dataStreams || []).filter((stream: any) => {
                    if (['wifi', 'device_metadata', 'steps'].includes(stream.stream_type)) return false;
                    if (stream.stream_type === 'email_metadata') return isGmailUser;
                    return true;
                  }).map((stream: any) => {
                  const isLoading = loadingStates[stream.id] || false;
                  
                  return (
                    <View key={stream.id} style={styles.streamPermission}>
                      <View style={styles.streamPermissionInfo}>
                        <Icon name={getStreamIcon(stream.stream_type)} size={20} color="#666" />
                        <View style={styles.streamPermissionText}>
                          <Text style={styles.streamPermissionName}>
                            {getStreamName(stream.stream_type)}
                          </Text>
                          <Text style={styles.streamPermissionDescription}>
                            {getStreamDescription(stream.stream_type)}
                          </Text>
                          <Text style={styles.streamEarnings}>
                            Earn 1 point per data collected
                          </Text>
                          {stream.is_enabled && (
                            <Text style={styles.trackingStatus}>
                              🟢 Active - {stream.data_count || 0} points collected
                            </Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={[styles.toggleSwitch, stream.is_enabled && styles.toggleSwitchActive]}
                        onPress={async () => {
                          await toggleDataStream(stream.id, !stream.is_enabled);
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <View style={styles.loadingIndicator}>
                            <Text style={styles.loadingText}>...</Text>
                          </View>
                        ) : (
                          <View style={[styles.toggleKnob, stream.is_enabled && styles.toggleKnobActive]} />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                  });
                })()}
              </View>
            </View>

            {/* Gmail Debug Information - Only show for Gmail users */}
            {/*{user?.email?.endsWith('@gmail.com') && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Icon name="bug" size={20} color="#FF9500" />
                  <Text style={styles.cardTitle}>Gmail Debug Info</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.debugInfo}>
                    <View style={styles.debugRow}>
                      <Text style={styles.debugLabel}>Gmail User:</Text>
                      <Text style={[styles.debugValue, { color: gmailDebugInfo.isGmailUser ? '#34C759' : '#FF3B30' }]}>
                        {gmailDebugInfo.isGmailUser ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.debugRow}>
                      <Text style={styles.debugLabel}>Gmail Signed In:</Text>
                      <Text style={[styles.debugValue, { color: gmailDebugInfo.isSignedIn ? '#34C759' : '#FF3B30' }]}>
                        {gmailDebugInfo.isSignedIn ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.debugRow}>
                      <Text style={styles.debugLabel}>Auth Status:</Text>
                      <Text style={[styles.debugValue, { color: gmailDebugInfo.authStatus === 'Authenticated' ? '#34C759' : '#FF3B30' }]}>
                        {gmailDebugInfo.authStatus}
                      </Text>
                    </View>
                    {gmailDebugInfo.lastError && (
                      <View style={styles.debugRow}>
                        <Text style={styles.debugLabel}>Last Error:</Text>
                        <Text style={[styles.debugValue, { color: '#FF3B30' }]}>
                          {gmailDebugInfo.lastError}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.debugLogs}>
                    <Text style={styles.debugLogsTitle}>Recent Activity:</Text>
                    {gmailDebugInfo.debugLogs.map((log, index) => (
                      <Text key={index} style={styles.debugLog}>
                        {log}
                      </Text>
                    ))}
                  </View>
                  
                  <View style={styles.debugButtons}>
                    <TouchableOpacity 
                      style={styles.refreshDebugButton}
                      onPress={updateGmailDebugInfo}
                    >
                      <Icon name="refresh" size={16} color="#007AFF" />
                      <Text style={styles.refreshDebugButtonText}>Refresh Debug Info</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.testConfigButton}
                      onPress={async () => {
                        try {
                          const gmailAuthService = RealGmailAuthService.getInstance();
                          const testResult = await gmailAuthService.testConfiguration();
                          
                          setGmailDebugInfo(prev => ({
                            ...prev,
                            lastError: testResult.success ? null : testResult.error || 'Configuration test failed',
                            debugLogs: [
                              ...prev.debugLogs.slice(-4),
                              `[${new Date().toLocaleTimeString()}] Config test: ${testResult.success ? 'Success' : 'Failed - ' + (testResult.error || 'Unknown error')}`
                            ]
                          }));
                          
                          if (testResult.success) {
                            Alert.alert('Configuration Test', 'OAuth configuration is working correctly!');
                          } else {
                            Alert.alert('Configuration Error', testResult.error || 'Configuration test failed');
                          }
                        } catch (error) {
                          const errorMsg = `Configuration test error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                          setGmailDebugInfo(prev => ({
                            ...prev,
                            lastError: errorMsg,
                            debugLogs: [
                              ...prev.debugLogs.slice(-4),
                              `[${new Date().toLocaleTimeString()}] Error: ${errorMsg}`
                            ]
                          }));
                          Alert.alert('Test Error', errorMsg);
                        }
                      }}
                    >
                      <Icon name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.testConfigButtonText}>Test OAuth Config</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.testConfigButton, { backgroundColor: '#FF9500' }]}
                      onPress={async () => {
                        try {
                          const gmailAuthService = RealGmailAuthService.getInstance();
                          const debugInfo = await gmailAuthService.getDebugInfo();
                          
                          const debugText = JSON.stringify(debugInfo, null, 2);
                          Alert.alert(
                            'Detailed Debug Info', 
                            debugText,
                            [{ text: 'OK' }],
                            { userInterfaceStyle: 'light' }
                          );
                        } catch (error) {
                          Alert.alert('Debug Error', error instanceof Error ? error.message : 'Unknown error');
                        }
                      }}
                    >
                      <Icon name="information-circle" size={16} color="#fff" />
                      <Text style={[styles.testConfigButtonText, { color: '#fff' }]}>Detailed Debug</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.testConfigButton, { backgroundColor: '#007AFF' }]}
                      onPress={async () => {
                        try {
                          const gmailAuthService = RealGmailAuthService.getInstance();
                          const oauthCheck = await gmailAuthService.checkOAuthConfiguration();
                          
                          let message = `OAuth Configuration Check:\n\n`;
                          message += `Status: ${oauthCheck.success ? '✅ PASSED' : '❌ FAILED'}\n\n`;
                          
                          if (oauthCheck.issues.length > 0) {
                            message += `Issues Found:\n`;
                            oauthCheck.issues.forEach((issue, index) => {
                              message += `${index + 1}. ${issue}\n`;
                            });
                            message += `\n`;
                          }
                          
                          if (oauthCheck.recommendations.length > 0) {
                            message += `Recommendations:\n`;
                            oauthCheck.recommendations.forEach((rec, index) => {
                              message += `${index + 1}. ${rec}\n`;
                            });
                          }
                          
                          Alert.alert(
                            'OAuth Configuration Check', 
                            message,
                            [{ text: 'OK' }],
                            { userInterfaceStyle: 'light' }
                          );
                        } catch (error) {
                          Alert.alert('OAuth Check Error', error instanceof Error ? error.message : 'Unknown error');
                        }
                      }}
                    >
                      <Icon name="checkmark-circle" size={16} color="#fff" />
                      <Text style={[styles.testConfigButtonText, { color: '#fff' }]}>OAuth Check</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.testConfigButton, { backgroundColor: '#8E44AD' }]}
                      onPress={async () => {
                        try {
                          const testResults = await GmailAuthTest.runTests();
                          
                          let message = `Gmail Authentication Test Results:\n\n`;
                          message += `Overall Status: ${testResults.success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n\n`;
                          message += `Detailed Results:\n${testResults.results.join('\n')}`;
                          
                          if (testResults.error) {
                            message += `\n\n❌ Error: ${testResults.error}`;
                          }
                          
                          Alert.alert(
                            'Gmail Authentication Tests', 
                            message,
                            [{ text: 'OK' }],
                            { cancelable: true }
                          );
                        } catch (error) {
                          Alert.alert('Test Suite Error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                      }}
                    >
                      <Icon name="flask" size={16} color="#FFFFFF" />
                      <Text style={[styles.testConfigButtonText, { color: '#FFFFFF' }]}>Run All Tests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.testConfigButton, { backgroundColor: '#E74C3C' }]}
                      onPress={async () => {
                        try {
                          const signInResult = await GmailAuthTest.testSignIn();
                          
                          let message = `Gmail Sign-In Test Results:\n\n`;
                          message += `Status: ${signInResult.success ? '✅ SIGN-IN SUCCESSFUL' : '❌ SIGN-IN FAILED'}\n\n`;
                          message += `Details:\n${signInResult.result}`;
                          
                          if (signInResult.error) {
                            message += `\n\n❌ Error: ${signInResult.error}`;
                          }
                          
                          Alert.alert(
                            'Gmail Sign-In Test', 
                            message,
                            [{ text: 'OK' }],
                            { cancelable: true }
                          );
                        } catch (error) {
                          Alert.alert('Sign-In Test Error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                      }}
                    >
                      <Icon name="log-in" size={16} color="#FFFFFF" />
                      <Text style={[styles.testConfigButtonText, { color: '#FFFFFF' }]}>Test Gmail Sign-In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.testConfigButton, { backgroundColor: '#27AE60' }]}
                      onPress={async () => {
                        try {
                          const diagnosticResult = await GoogleSignInDiagnostic.runDiagnostics();
                          
                          let message = `Google Sign-In Diagnostic Report:\n\n`;
                          message += `Status: ${diagnosticResult.success ? '✅ DIAGNOSTIC PASSED' : '❌ DIAGNOSTIC FAILED'}\n\n`;
                          message += `Results:\n${diagnosticResult.results.join('\n')}`;
                          
                          if (diagnosticResult.error) {
                            message += `\n\n❌ Error: ${diagnosticResult.error}`;
                          }
                          
                          Alert.alert(
                            'Google Sign-In Diagnostic', 
                            message,
                            [{ text: 'OK' }],
                            { cancelable: true }
                          );
                        } catch (error) {
                          Alert.alert('Diagnostic Error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                      }}
                    >
                      <Icon name="medical" size={16} color="#FFFFFF" />
                      <Text style={[styles.testConfigButtonText, { color: '#FFFFFF' }]}>Google Sign-In Diagnostic</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}*/}
          </View>
        )}

        {/* KYC Verification Tab */}
        {activeTab === 'kyc' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="shield" size={20} color="#007AFF" />
                <Text style={styles.cardTitle}>KYC Verification Status</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.kycStatusCard}>
                  <View style={[styles.kycStatusIcon, { backgroundColor: getKYCStatusColor(profile?.kyc_status) }]}>
                    <Icon name="shield" size={24} color="#fff" />
                  </View>
                  <View style={styles.kycStatusDetails}>
                    <Text style={styles.kycStatusTitle}>
                      {getKYCStatusText(profile?.kyc_status)}
                    </Text>
                    <Text style={styles.kycStatusDescription}>
                      {profile?.kyc_status === 'verified' ? 'Your identity has been verified successfully.' :
                       profile?.kyc_status === 'pending' ? 'Your verification is being reviewed.' :
                       profile?.kyc_status === 'rejected' ? 'Your verification was rejected. Please try again.' :
                       'Complete KYC verification to unlock higher earning potential.'}
                    </Text>
                  </View>
                </View>
                
                {profile?.kyc_status !== 'verified' && (
                  <TouchableOpacity style={styles.kycActionButton}>
                    <Text style={styles.kycActionText}>
                      {profile?.kyc_status === 'pending' ? 'Check Status' :
                       profile?.kyc_status === 'rejected' ? 'Try Again' : 'Start Verification'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Collection Controls Tab */}
        {activeTab === 'collection' && (
          <View style={styles.tabContent}>
            {/* Data Collection Controls */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="refresh" size={20} color="#007AFF" />
                <Text style={styles.cardTitle}>Data Collection Controls</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.collectionDescription}>
                  Manually trigger data collection to test your integrations and see immediate results.
                </Text>
                
                <View style={styles.collectionControls}>
                  {/* Commented out: Activity Data Collection (Steps & Activity) */}
                  {/* <View style={styles.collectionControl}>
                    <View style={styles.collectionControlInfo}>
                      <Icon name="heart" size={20} color="#007AFF" />
                      <View style={styles.collectionControlText}>
                        <Text style={styles.collectionControlTitle}>Collect Activity Data</Text>
                        <Text style={styles.collectionControlDescription}>Steps, calories, and fitness data</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.collectButton}
                      onPress={() => triggerDataCollection('activity')}
                      disabled={collectingData}
                    >
                      <Icon name={collectingData ? "refresh" : "play"} size={16} color="#fff" />
                      <Text style={styles.collectButtonText}>
                        {collectingData ? 'Collecting...' : 'Collect Now'}
                      </Text>
                    </TouchableOpacity>
                  </View> */}

                  <View style={styles.collectionControl}>
                    <View style={styles.collectionControlInfo}>
                      <Icon name="location" size={20} color="#007AFF" />
                      <View style={styles.collectionControlText}>
                        <Text style={styles.collectionControlTitle}>Collect Location Data</Text>
                        <Text style={styles.collectionControlDescription}>Location points and movement patterns</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.collectButton}
                      onPress={async () => {
                        setCollectingData(true);
                        try {
                          if (!locationInitialized) {
                            const granted = await requestLocationPermission();
                            if (!granted) {
                              Alert.alert('Permission Required', 'Location permission is required to collect location data.');
                              return;
                            }
                          }
                          
                          if (!locationTracking) {
                            await enableLocationStream();
                          }
                          
                          // Get current location immediately
                          const locationService = LocationDataService.getInstance();
                          const currentLocation = await locationService.getCurrentLocation();
                          
                          if (currentLocation) {
                            Alert.alert(
                              "Location Collected",
                              `Successfully collected current location: ${currentLocation.coords.latitude.toFixed(6)}, ${currentLocation.coords.longitude.toFixed(6)}`
                            );
                          } else {
                            Alert.alert("Location Error", "Failed to get current location. Please check your location settings.");
                          }
                        } catch (error: any) {
                          console.error('Location collection error:', error);
                          Alert.alert(
                            "Error",
                            `Failed to collect location data: ${error?.message || 'Unknown error'}`
                          );
                        } finally {
                          setCollectingData(false);
                        }
                      }}
                      disabled={collectingData}
                    >
                      <Icon name={collectingData ? "refresh" : "play"} size={16} color="#fff" />
                      <Text style={styles.collectButtonText}>
                        {collectingData ? 'Collecting...' : 'Collect Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.collectionControl}>
                    <View style={styles.collectionControlInfo}>
                      <Icon name="navigate" size={20} color="#007AFF" />
                      <View style={styles.collectionControlText}>
                        <Text style={styles.collectionControlTitle}>Collect Spatial Data</Text>
                        <Text style={styles.collectionControlDescription}>Spatial movement and grid cell visits</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.collectButton}
                      onPress={async () => {
                        setCollectingData(true);
                        try {
                          if (!spatialInitialized) {
                            const granted = await requestSpatialPermission();
                            if (!granted) {
                              Alert.alert('Permission Required', 'Spatial data collection requires location permission.');
                              return;
                            }
                          }
                          
                          if (!spatialEnabled) {
                            await enableSpatialStream();
                          }
                          
                          // Get current location and trigger spatial processing
                          const locationService = LocationDataService.getInstance();
                          const currentLocation = await locationService.getCurrentLocation();
                          
                          if (currentLocation) {
                            // Trigger spatial data processing
                            await spatialService.handleLocation(user?.id || '', {
                              latitude: currentLocation.coords.latitude,
                              longitude: currentLocation.coords.longitude,
                              timestamp: currentLocation.timestamp,
                            });
                            
                            Alert.alert(
                              "Spatial Data Collected",
                              `Successfully processed spatial data for location: ${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`
                            );
                          } else {
                            Alert.alert("Location Error", "Failed to get current location for spatial processing.");
                          }
                        } catch (error: any) {
                          console.error('Spatial collection error:', error);
                          Alert.alert(
                            "Error",
                            `Failed to collect spatial data: ${error?.message || 'Unknown error'}`
                          );
                        } finally {
                          setCollectingData(false);
                        }
                      }}
                      disabled={collectingData}
                    >
                      <Icon name={collectingData ? "refresh" : "play"} size={16} color="#fff" />
                      <Text style={styles.collectButtonText}>
                        {collectingData ? 'Collecting...' : 'Collect Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.collectionControl}>
                    <View style={styles.collectionControlInfo}>
                      <Icon name="flash" size={20} color="#007AFF" />
                      <View style={styles.collectionControlText}>
                        <Text style={styles.collectionControlTitle}>Analyze Behavioral Data</Text>
                        <Text style={styles.collectionControlDescription}>Generate insights from your activity patterns</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.collectButton}
                      onPress={async () => {
                        setCollectingData(true);
                        try {
                          if (!behavioralInitialized) {
                            const granted = await requestBehavioralPermission();
                            if (!granted) {
                              Alert.alert('Permission Required', 'Behavioral analytics requires initialization.');
                              return;
                            }
                          }
                          
                          if (!behavioralEnabled) {
                            await enableBehavioralStream();
                          }
                          
                          // Run behavioral analysis
                          const insights = await analyzeBehavior();
                          
                          Alert.alert(
                            "Behavioral Analysis Complete",
                            `Successfully generated ${insights.length} behavioral insights from your data patterns.`
                          );
                        } catch (error: any) {
                          console.error('Behavioral analysis error:', error);
                          Alert.alert(
                            "Error",
                            `Failed to analyze behavioral data: ${error?.message || 'Unknown error'}`
                          );
                        } finally {
                          setCollectingData(false);
                        }
                      }}
                      disabled={collectingData || isAnalyzing}
                    >
                      <Icon name={collectingData || isAnalyzing ? "refresh" : "play"} size={16} color="#fff" />
                      <Text style={styles.collectButtonText}>
                        {collectingData || isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.collectionControl}>
                    <View style={styles.collectionControlInfo}>
                      <Icon name="refresh" size={20} color="#007AFF" />
                      <View style={styles.collectionControlText}>
                        <Text style={styles.collectionControlTitle}>Collect All Data</Text>
                        <Text style={styles.collectionControlDescription}>Run full data collection for all enabled streams</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.collectButton, styles.collectAllButton]}
                      onPress={() => triggerDataCollection('all')}
                      disabled={collectingData}
                    >
                      <Icon name={collectingData ? "refresh" : "play"} size={16} color="#fff" />
                      <Text style={styles.collectButtonText}>
                        {collectingData ? 'Collecting...' : 'Collect All'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.automatedCollectionInfo}>
                  <Icon name="checkmark-circle" size={16} color="#007AFF" />
                  <View style={styles.automatedCollectionText}>
                    <Text style={styles.automatedCollectionTitle}>Automated Collection Active</Text>
                    <Text style={styles.automatedCollectionDescription}>
                      Data is automatically collected every 5-30 minutes when streams are enabled. 
                      Manual collection is for testing and immediate updates.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Notifications */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="notifications" size={20} color="#007AFF" />
                <Text style={styles.cardTitle}>Notifications</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.notificationSetting}>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>New Survey Alerts</Text>
                    <Text style={styles.notificationDescription}>Get notified about new earning opportunities</Text>
                  </View>
                  <View style={styles.notificationToggle}>
                    <Text style={styles.notificationToggleText}>Enabled</Text>
                  </View>
                </View>
                
                <View style={styles.notificationSetting}>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>Earnings Updates</Text>
                    <Text style={styles.notificationDescription}>Weekly summary of your earnings</Text>
                  </View>
                  <View style={styles.notificationToggle}>
                    <Text style={styles.notificationToggleText}>Enabled</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity style={[styles.card, styles.signOutCard]} onPress={handleSignOut}>
          <Icon name="log-out" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};



// Admin Screen - Using the comprehensive Admin component
const AdminScreen = () => {
  return (
    <ErrorBoundary onError={(error) => console.error('Admin Error:', error)}>
      <Admin />
    </ErrorBoundary>
  );
};

// Simple Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // Let the parent handle the error display
    }

    return this.props.children;
  }
}

// Auth Stack Navigator
const AuthStack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
};

// Custom Header Component with Profile Photo
const CustomHeader = ({ title }: { title: string }) => {
  const { data: profile } = useProfile();
  const navigation = useNavigation();
  
  const handleProfilePress = () => {
    navigation.navigate('Settings' as never);
  };
  
  return (
    <View style={styles.customHeader}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity 
        style={styles.headerProfileContainer}
        onPress={handleProfilePress}
        activeOpacity={0.7}
      >
        {profile?.avatar_url ? (
          <Image 
            source={{ uri: profile.avatar_url }} 
            style={styles.headerAvatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.headerAvatarPlaceholder}>
            <Text style={styles.headerAvatarText}>
              {profile?.first_name?.[0] || 'U'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Tab Navigator - Memoized to prevent unnecessary re-renders
const TabNavigator = React.memo(() => {
  const adminCheck = useAdminCheck();
  const { trackEvent, deviceFingerprint, isInitialized } = useDeviceFingerprinting();
  const isAdmin = adminCheck?.isAdmin || false;
  
  // Track screen views automatically
  const handleScreenChange = useCallback((routeName: string) => {
    if (isInitialized && deviceFingerprint) {
      trackEvent('screen_view', {
        screen_name: routeName,
        device_id: deviceFingerprint.device_id,
      });
    }
  }, [isInitialized, deviceFingerprint, trackEvent]);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Activity':
              iconName = focused ? 'pulse' : 'pulse-outline';
              break;
            case 'Surveys':
              iconName = focused ? 'list' : 'list-outline';
              break;

            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            case 'Admin':
              iconName = focused ? 'shield' : 'shield-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        header: ({ route }) => <CustomHeader title={route.name} />,
        headerStyle: {
          backgroundColor: '#f8f9fa',
        },
      })}
      screenListeners={{
        focus: (e) => {
          handleScreenChange(e.target?.split('-')[0] || 'unknown');
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Activity" 
        component={ActivityScreen}
        options={{ title: 'Activity' }}
      />
      <Tab.Screen 
        name="Surveys" 
        component={SurveysScreen}
        options={{ title: 'Surveys' }}
      />

      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      {isAdmin && (
        <Tab.Screen 
          name="Admin" 
          component={AdminScreen}
          options={{ title: 'Admin' }}
        />
      )}
    </Tab.Navigator>
  );
});

// Main App with Auth Logic
const MainApp = () => {
  const { loading, isAuthenticated } = useAuth();
  const { trackEvent, deviceFingerprint, isInitialized } = useDeviceFingerprinting();
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string | undefined>(undefined);
  
  // Initialize Expo Gmail Auth Service when app starts
  useEffect(() => {
    const initializeGmailAuth = async () => {
      try {
        const gmailAuthService = RealGmailAuthService.getInstance();
        const testResult = await gmailAuthService.testConfiguration();
        if (testResult.success) {
          console.log('Expo Gmail Auth Service initialized successfully');
        } else {
          console.error('Expo Gmail Auth Service configuration failed:', testResult.error);
        }
      } catch (error) {
        console.error('Failed to initialize Expo Gmail Auth Service:', error);
      }
    };
    
    initializeGmailAuth();
  }, []);
  
  // Track app lifecycle events automatically
  useEffect(() => {
    if (isInitialized && deviceFingerprint) {
      trackEvent('app_lifecycle', {
        event: 'app_started',
        device_id: deviceFingerprint.device_id,
        os_type: deviceFingerprint.os_type,
        app_version: deviceFingerprint.app_version,
      });
    }
  }, [isInitialized, deviceFingerprint, trackEvent]);

  // Track authentication state changes
  useEffect(() => {
    if (isInitialized && deviceFingerprint) {
      trackEvent('auth_state_change', {
        is_authenticated: isAuthenticated,
        device_id: deviceFingerprint.device_id,
      });
    }
  }, [isAuthenticated, isInitialized, deviceFingerprint, trackEvent]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}

    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DeviceFingerprintingProvider>
          <ErrorBoundary onError={(error) => console.error('App Error:', error)}>
            <MainApp />
          </ErrorBoundary>
        </DeviceFingerprintingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  authForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  displayValue: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  displayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  authButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonDisabled: {
    backgroundColor: '#ccc',
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 24,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  kpiSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  streamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#34C759',
  },
  inactiveBadge: {
    backgroundColor: '#666',
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  inProgressBadge: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  streamDetails: {
    marginBottom: 12,
  },
  streamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streamLabel: {
    fontSize: 14,
    color: '#666',
  },
  streamValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  streamNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  collectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  collectButtonDisabled: {
    backgroundColor: '#ccc',
  },
  collectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Auto-collection styles
  emailCollectionSection: {
    marginTop: 12,
    gap: 8,
  },
  autoCollectionStatusActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#34C759',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  autoCollectionStatusDisabled: {
    backgroundColor: '#FFF4E6',
    borderColor: '#FF9500',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  reauthPrompt: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF3B30',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  stopButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  enableButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  reauthButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reauthButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  surveyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  surveyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  surveyRewards: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginRight: 16,
  },
  surveyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  signOutCard: {
    backgroundColor: '#fff',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  signOutText: {
    color: '#FF3B30',
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContent: {
    marginBottom: 20,
  },
  // Card Header and Content Styles
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardContent: {
    paddingTop: 8,
  },
  // Profile Section Styles
  profileSection: {
    gap: 16,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  // KYC Status Styles
  kycStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  kycStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kycStatusText: {
    gap: 2,
  },
  kycStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  kycStatusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  kycBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  kycBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Wallet Connection Styles
  walletConnection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  walletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flex: 1,
    marginLeft: 12,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  walletAddress: {
    fontSize: 14,
    color: '#666',
  },
  connectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  connectedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  connectWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    gap: 8,
  },
  connectWalletText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  walletNotConnected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  notConnectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
  },
  notConnectedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  disconnectWalletButton: {
    borderColor: '#ef4444',
  },
  disconnectWalletText: {
    color: '#ef4444',
  },
  // Data Stream Permissions Styles
  permissionsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  streamPermission: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  streamPermissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  streamPermissionText: {
    flex: 1,
  },
  streamPermissionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  streamPermissionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  streamEarnings: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  // Toggle Switch Styles
  toggleSwitch: {
    width: 44,
    height: 24,
    backgroundColor: '#ddd',
    borderRadius: 12,
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#007AFF',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  // KYC Status Card Styles
  kycStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  kycStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycStatusDetails: {
    flex: 1,
  },
  kycStatusDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  kycActionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  kycActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Collection Controls Styles
  collectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  collectionControls: {
    gap: 12,
  },
  collectionControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  collectionControlInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  collectionControlText: {
    flex: 1,
  },
  collectionControlTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  collectionControlDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  collectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  collectAllButton: {
    backgroundColor: '#34C759',
  },
  collectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  automatedCollectionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  automatedCollectionText: {
    flex: 1,
  },
  automatedCollectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  automatedCollectionDescription: {
    fontSize: 12,
    color: '#1976D2',
    marginTop: 2,
  },
  // Notification Styles
  notificationSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notificationToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  notificationToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  // Custom Header styles
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerProfileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  earningsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  // Streams grid
  streamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  streamCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  streamName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  streamData: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  // Activity list
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Stream items
  streamItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // Data Stream Cards
  streamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: '#34C759',
  },
  inactiveBadge: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  streamDetails: {
    marginBottom: 12,
  },
  streamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  streamLabel: {
    fontSize: 14,
    color: '#666',
  },
  streamValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  streamNote: {
    fontSize: 12,
    color: '#FF9500',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  streamStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  streamStats: {
    alignItems: 'flex-end',
  },
  streamEarnings: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  // Earning items
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  earningContent: {
    marginLeft: 12,
    flex: 1,
  },
  earningAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  earningTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  // General card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    // Additional content styling if needed
  },
  // Tab navigation styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    // Tab content styling
  },
  // KYC styles
  kycStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  kycStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  kycStatusDetails: {
    flex: 1,
  },
  kycStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  kycStatusDescription: {
    fontSize: 14,
    color: '#666',
  },
  kycActionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  kycActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Collection controls styles
  collectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  collectionControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  collectionControlInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collectionControlText: {
    marginLeft: 12,
    flex: 1,
  },
  collectionControlTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  collectionControlDescription: {
    fontSize: 12,
    color: '#666',
  },
  // Profile section styles
  profileSection: {
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  changePhotoButton: {
    paddingVertical: 8,
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  kycStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  kycStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kycStatusText: {
    marginLeft: 8,
    flex: 1,
  },
  kycBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  kycBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Wallet connection styles
  walletConnection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  walletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  connectedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  connectWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  connectWalletText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Data stream permissions styles
  permissionsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  streamPermission: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  streamPermissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streamPermissionText: {
    marginLeft: 12,
    flex: 1,
  },
  streamPermissionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  streamPermissionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  streamEarnings: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  trackingStatus: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
    marginTop: 4,
  },
  // Survey and task cards
  surveyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  surveyReward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  surveyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  surveyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  surveyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  taskReward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  taskButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Profile card
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Toggle switch
  toggleSwitch: {
    width: 48,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#3B82F6',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  toggleKnobActive: {
    marginLeft: 'auto',
  },
  // Collection controls
  collectionControls: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  collectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  collectAllButton: {
    backgroundColor: '#34C759',
  },
  collectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Automated collection info
  automatedCollectionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  automatedCollectionText: {
    marginLeft: 8,
    flex: 1,
  },
  automatedCollectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  automatedCollectionDescription: {
    fontSize: 12,
    color: '#666',
  },
  // Notifications styles
  notificationSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: 12,
    color: '#666',
  },
  notificationToggle: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notificationToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Sign out styles
  signOutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  // Sign out button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  // Admin buttons
  adminButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  // Loading indicator styles
  loadingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Debug UI styles
  debugInfo: {
    marginBottom: 16,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  debugLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  debugValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  debugLogs: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  debugLogsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  debugLog: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  refreshDebugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshDebugButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  debugButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testConfigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fff0',
    borderColor: '#34C759',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
  },
  testConfigButtonText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  // Email collection button styles
  manualCollectionSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  collectButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  collectButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  collectButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  debugButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  debugButtonText: {
    color: '#6b7280',
    fontWeight: '500',
  },
});





export default App;
