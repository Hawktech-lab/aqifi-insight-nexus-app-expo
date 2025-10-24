import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './integrations/supabase/client';
import Icon from 'react-native-vector-icons/Ionicons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

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

// Dashboard Screen matching original React app
const DashboardScreen = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: dataStreams } = useDataStreams();
  const { data: transactions } = useEarnings();

  const activeStreams = dataStreams?.filter((stream: any) => stream.is_enabled).length || 0;
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
            <Text style={styles.kpiSubtitle}>{dataStreams?.length || 0} total available</Text>
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
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="pulse" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Complete Profile Setup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="trophy" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>View Available Missions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
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
  const { data: dataStreams, isLoading } = useDataStreams();

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

  const activeStreams = dataStreams?.filter((stream: any) => stream.is_enabled) || [];
  const totalEarnings = dataStreams?.reduce((sum: number, stream: any) => 
    sum + (stream.data_count || 0) * 1, 0 // 1 point per data collected
  ) || 0;
  const pendingStreams = dataStreams?.filter((stream: any) => !stream.is_enabled) || [];

  const getStreamIcon = (streamType: string) => {
    switch (streamType) {
      case 'steps': return 'footsteps';
      case 'device_metadata': return 'phone-portrait';
      case 'email_metadata': return 'mail';
      case 'wifi': return 'wifi';
      case 'spatial': return 'navigate';
      case 'location': return 'location';
      case 'behavioral': return 'flash';
      default: return 'pulse';
    }
  };

  const getStreamName = (streamType: string) => {
    switch (streamType) {
      case 'steps': return 'Steps & Activity';
      case 'device_metadata': return 'Device Metadata';
      case 'email_metadata': return 'Gmail Data';
      case 'wifi': return 'WiFi Sharing';
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
        {dataStreams?.map((stream: any) => {
          const potentialEarnings = (stream.data_count || 0) * 1; // 1 point per data collected
          
          return (
            <View key={stream.id} style={styles.streamCard}>
              <View style={styles.streamHeader}>
                <View style={styles.streamInfo}>
                  <Icon name={getStreamIcon(stream.stream_type)} size={20} color="#666" />
                  <Text style={styles.streamTitle}>{getStreamName(stream.stream_type)}</Text>
                </View>
                <View style={[styles.statusBadge, stream.is_enabled ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={styles.statusText}>{stream.is_enabled ? 'active' : 'disabled'}</Text>
                </View>
              </View>
              
              <View style={styles.streamDetails}>
                <View style={styles.streamRow}>
                  <Text style={styles.streamLabel}>Earnings Rate</Text>
                  <Text style={styles.streamValue}>1 pt/data</Text>
                </View>
                <View style={styles.streamRow}>
                  <Text style={styles.streamLabel}>Data Points</Text>
                  <Text style={styles.streamValue}>{stream.data_count || 0} collected</Text>
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
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

// Main App with Auth Logic
const MainApp = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Tab Navigator
const TabNavigator = () => {
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
        headerStyle: {
          backgroundColor: '#f8f9fa',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
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
      <Tab.Screen 
        name="Admin" 
        component={AdminScreen}
        options={{ title: 'Admin' }}
      />
    </Tab.Navigator>
  );
};

// Placeholder screens for now
const SurveysScreen = () => (
  <View style={styles.container}>
    <Text style={styles.screenTitle}>Surveys & Tasks</Text>
    <Text style={styles.screenSubtitle}>Coming soon...</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.screenTitle}>Settings</Text>
    <Text style={styles.screenSubtitle}>Coming soon...</Text>
  </View>
);

const AdminScreen = () => (
  <View style={styles.container}>
    <Text style={styles.screenTitle}>Admin Panel</Text>
    <Text style={styles.screenSubtitle}>Coming soon...</Text>
  </View>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainApp />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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
});

export default App;
