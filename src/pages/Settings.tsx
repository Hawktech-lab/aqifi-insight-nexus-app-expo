import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Switch, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { 
  User, 
  Wallet, 
  Shield, 
  Bell, 
  MapPin, 
  Navigation, 
  Zap, 
  RefreshCw, 
  LogOut,
  Mail
} from "lucide-react-native";

// Import actual hooks for database integration
import { useProfile } from '../hooks/useProfile';
import { useDataStreams } from '../hooks/useDataStreams';
import { useAuth } from '../contexts/AuthContext';
import { useEmailMetadata } from '../hooks/useEmailMetadata';

// Data Stream Toggle Component
const DataStreamToggle = ({ 
  stream, 
  onToggle, 
  isLoading 
}: {
  stream: any;
  onToggle: (enabled: boolean) => void;
  isLoading: boolean;
}) => {
  // Safety check for stream data
  if (!stream) {
    console.warn('DataStreamToggle: stream is null or undefined');
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'location': return MapPin;
      case 'spatial': return Navigation;
      case 'behavioral': return Zap;
      case 'email_metadata': return Mail;
      default: return Wallet;
    }
  };

  const getDisplayName = (type: string) => {
    switch (type) {
      case 'location': return 'Location Data';
      case 'spatial': return 'Spatial Movement';
      case 'behavioral': return 'Behavioral Data';
      case 'email_metadata': return 'Email Metadata';
      default: return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const Icon = getIcon(stream.stream_type || 'unknown');

  return (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 1,
      borderColor: '#e5e7eb'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Icon size={24} color="#6b7280" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '500', color: '#111827' }}>
              {getDisplayName(stream.stream_type || 'unknown')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: (stream.is_enabled === true) ? '#dcfce7' : '#f3f4f6'
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: (stream.is_enabled === true) ? '#166534' : '#374151'
                }}>
                  {(stream.is_enabled === true) ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
                1 pt/data
              </Text>
            </View>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Switch
              value={stream.is_enabled === true}
              onValueChange={(value) => {
                try {
                  onToggle(value);
                } catch (error) {
                  console.error('Error in Switch onValueChange:', error);
                }
              }}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={(stream.is_enabled === true) ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          )}
        </View>
      </View>
      
      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>Data Points</Text>
          <Text style={{ fontSize: 12, fontWeight: '500' }}>{stream.data_count || 0}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>Last Sync</Text>
          <Text style={{ fontSize: 12, fontWeight: '500' }}>
            {stream.last_sync_at ? new Date(stream.last_sync_at).toLocaleDateString() : 'Never'}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Main Settings Component
export default function Settings({ route }: any) {
  // Use actual hooks for database integration
  const { user, signOut, updatePassword } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { dataStreams, loading: streamsLoading, toggleDataStream, refreshDataStreams } = useDataStreams();
  const { 
    stats: emailStats, 
    collectEmailMetadata, 
    resetEmailMetadata,
    isCollecting: emailCollecting 
  } = useEmailMetadata();
  
  // Check if user is logged in with Gmail
  const isGmailUser = user?.email?.endsWith('@gmail.com') || false;
  
  // State
  const [currentTab, setCurrentTab] = useState(route?.params?.initialTab || 'profile');
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  
  // Refs for scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const dataStreamsRef = useRef<View>(null);
  const [dataStreamsY, setDataStreamsY] = useState(0);
  
  // Handle route parameter changes
  useEffect(() => {
    if (route?.params?.initialTab) {
      setCurrentTab(route.params.initialTab);
      
      // If navigating to data-streams, scroll immediately
      if (route.params.initialTab === 'data-streams') {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 200, animated: true });
        }, 100);
      }
    }
  }, [route?.params?.initialTab]);
  
  // Handle scrolling to data streams when tab changes to data-streams
  useEffect(() => {
    if (currentTab === 'data-streams') {
      // Delay to ensure the tab content is fully rendered
      setTimeout(() => {
        if (dataStreamsRef.current && scrollViewRef.current) {
          dataStreamsRef.current.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              console.log('Measured position:', x, y);
              scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
            },
            () => {
              console.log('Measure error');
              // Fallback: scroll to a reasonable position (after header and tabs)
              scrollViewRef.current?.scrollTo({ y: 200, animated: true });
            }
          );
        } else {
          // Simple fallback: scroll to a reasonable position
          scrollViewRef.current?.scrollTo({ y: 200, animated: true });
        }
      }, 500);
    }
  }, [currentTab]);
  
  // Handle data streams section layout
  const handleDataStreamsLayout = (event: any) => {
    const { y } = event.nativeEvent.layout;
    console.log('Data streams layout Y:', y);
    setDataStreamsY(y);
  };
  
  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Update profile form when profile data loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setEmail(user?.email || '');
    }
  }, [profile, user]);

  // Ensure email_metadata stream exists for Gmail users
  useEffect(() => {
    if (user && isGmailUser && refreshDataStreams) {
      refreshDataStreams();
    }
  }, [user, isGmailUser, refreshDataStreams]);

  const handleStreamToggle = async (streamId: string, enabled: boolean) => {
    // Safety check
    if (!streamId) {
      console.error('Invalid streamId:', streamId);
      Alert.alert('Error', 'Invalid stream ID');
      return;
    }
    
    console.log(`Toggling stream ${streamId} to ${enabled}`);
    
    // Set loading state for this specific stream
    setLoadingStates(prev => ({ ...prev, [streamId]: true }));
    
    try {
      // Use the actual toggleDataStream function from the hook
      await toggleDataStream(streamId, enabled);
      
      console.log(`Successfully toggled stream ${streamId} to ${enabled}`);
      
    } catch (error) {
      console.error(`Error toggling stream ${streamId}:`, error);
      Alert.alert('Error', 'Failed to update data stream');
    } finally {
      setLoadingStates(prev => ({ ...prev, [streamId]: false }));
    }
  };

  const handleProfileUpdate = async () => {
    try {
      // Use the actual updateProfile function from the hook
      const { error } = await updateProfile({
        first_name: firstName,
        last_name: lastName
      });
      
      if (error) {
        Alert.alert('Error', 'Failed to update profile');
      } else {
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to update password');
      } else {
        Alert.alert('Success', 'Password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('Error', 'Failed to update password');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('User signed out successfully');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  if (profileLoading || streamsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Settings</Text>
          <Text style={{ color: '#6b7280', marginTop: 4 }}>Manage your account and preferences</Text>
        </View>


        {/* Tab Navigation */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: 'white',
          borderRadius: 8,
          padding: 4,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: '#e5e7eb'
        }}>
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'data-streams', label: 'Data Streams', icon: Wallet },
            ...(isGmailUser ? [{ id: 'email-settings', label: 'Email', icon: Mail }] : []),
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setCurrentTab(tab.id)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive ? '#bfdbfe' : 'transparent'
                }}
              >
                <Icon size={16} color={isActive ? '#2563eb' : '#6b7280'} style={{ marginRight: 8 }} />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: isActive ? '#2563eb' : '#6b7280'
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content */}
        {currentTab === 'profile' && (
          <View>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#e5e7eb'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <User size={20} color="#6b7280" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Personal Information</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>First Name</Text>
                <TextInput
                  placeholder="Enter first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16
                  }}
                />
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Last Name</Text>
                <TextInput
                  placeholder="Enter last name"
                  value={lastName}
                  onChangeText={setLastName}
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16
                  }}
                />
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Email</Text>
                <TextInput
                  placeholder="Enter email"
                  value={email}
                  onChangeText={setEmail}
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16
                  }}
                />
              </View>
              
              <TouchableOpacity
                onPress={handleProfileUpdate}
                style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontWeight: '500' }}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'data-streams' && (
          <View ref={dataStreamsRef} onLayout={handleDataStreamsLayout}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>Data Streams</Text>
              <TouchableOpacity
                onPress={refreshDataStreams}
                style={{
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <RefreshCw size={16} color="#000" style={{ marginRight: 4 }} />
                <Text style={{ color: '#374151', fontWeight: '500' }}>Refresh</Text>
              </TouchableOpacity>
            </View>
            
            {dataStreams
              .filter(stream => {
                // Filter out email metadata for non-Gmail users
                if (stream.stream_type === 'email_metadata' && !isGmailUser) {
                  return false;
                }
                return true;
              })
              .map((stream) => {
                // Safety check to prevent crashes
                if (!stream || !stream.id) {
                  console.warn('Invalid stream data:', stream);
                  return null;
                }
                
                return (
                  <DataStreamToggle
                    key={stream.id}
                    stream={stream}
                    onToggle={(enabled) => handleStreamToggle(stream.id, enabled)}
                    isLoading={loadingStates[stream.id] || false}
                  />
                );
              })}
          </View>
        )}

        {currentTab === 'email-settings' && isGmailUser && (
          <View>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#e5e7eb'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Mail size={20} color="#6b7280" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Email Metadata Collection</Text>
              </View>
              
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 16, lineHeight: 20 }}>
                Collect email metadata (from, to, subject, date) without accessing email body content or attachments. 
                Earn 1 point per email collected. Duplicate emails are automatically filtered out.
              </Text>
              
              <View style={{ 
                backgroundColor: '#f3f4f6', 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 16 
              }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                  Collection Statistics
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Total Emails</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                      {emailStats.totalEmails}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Points Earned</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#10b981' }}>
                      {emailStats.pointsEarned}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Unread</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#f59e0b' }}>
                      {emailStats.unreadEmails}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={collectEmailMetadata}
                  disabled={emailCollecting}
                  style={{
                    flex: 1,
                    backgroundColor: emailCollecting ? '#9ca3af' : '#3b82f6',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center'
                  }}
                >
                  {emailCollecting ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={{ color: 'white', fontWeight: '500', marginLeft: 8 }}>Collecting...</Text>
                    </>
                  ) : (
                    <>
                      <Mail size={16} color="white" style={{ marginRight: 8 }} />
                      <Text style={{ color: 'white', fontWeight: '500' }}>Collect Now</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={resetEmailMetadata}
                  style={{
                    backgroundColor: 'white',
                    borderWidth: 1,
                    borderColor: '#ef4444',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#ef4444', fontWeight: '500' }}>Reset</Text>
                </TouchableOpacity>
              </View>
              
              {emailStats.lastCollectionDate && (
                <View style={{ 
                  backgroundColor: '#dbeafe', 
                  padding: 12, 
                  borderRadius: 8, 
                  marginTop: 16 
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#1e40af' }}>
                    Last Collection
                  </Text>
                  <Text style={{ fontSize: 14, color: '#1e40af', marginTop: 4 }}>
                    {new Date(emailStats.lastCollectionDate).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#e5e7eb'
            }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
                Privacy & Security
              </Text>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>
                  ✓ No Email Body Content
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  Only email headers (from, to, subject, date) are collected
                </Text>
              </View>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>
                  ✓ No Attachments
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  File attachments are never accessed or stored
                </Text>
              </View>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>
                  ✓ Duplicate Prevention
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  Message IDs are tracked to prevent duplicate point awards
                </Text>
              </View>
              
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>
                  ✓ Secure Storage
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  All data is encrypted and stored securely in our database
                </Text>
              </View>
            </View>
          </View>
        )}

        {currentTab === 'security' && (
          <View>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#e5e7eb'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Shield size={20} color="#6b7280" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Change Password</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>New Password</Text>
                <TextInput
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16
                  }}
                />
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>Confirm Password</Text>
                <TextInput
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16
                  }}
                />
              </View>
              
              {passwordError && (
                <Text style={{ color: '#ef4444', fontSize: 14, marginBottom: 16 }}>{passwordError}</Text>
              )}
              
              <TouchableOpacity
                onPress={handlePasswordChange}
                style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontWeight: '500' }}>Update Password</Text>
              </TouchableOpacity>
            </View>

            <View style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#e5e7eb'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontWeight: '500', color: '#111827' }}>Sign Out</Text>
                  <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>Sign out of your account</Text>
                </View>
                <TouchableOpacity
                  onPress={handleSignOut}
                  style={{
                    backgroundColor: '#ef4444',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <LogOut size={16} color="white" style={{ marginRight: 4 }} />
                  <Text style={{ color: 'white', fontWeight: '500' }}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {currentTab === 'notifications' && (
          <View>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#e5e7eb'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Bell size={20} color="#6b7280" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Notifications</Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '500', color: '#111827' }}>New Survey Alerts</Text>
                    <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>Get notified about new earning opportunities</Text>
                  </View>
                  <Switch value={true} onValueChange={() => {}} />
                </View>
              </View>
              
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '500', color: '#111827' }}>Earnings Updates</Text>
                    <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>Weekly summary of your points</Text>
                  </View>
                  <Switch value={true} onValueChange={() => {}} />
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
