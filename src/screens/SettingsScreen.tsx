import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { settingsStyles } from '../styles/settingsStyles';

export const SettingsScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) {
    return (
      <ScrollView style={settingsStyles.container}>
        <View style={settingsStyles.content}>
          <Text style={settingsStyles.screenTitle}>Settings</Text>
          <View style={settingsStyles.card}>
            <Text style={settingsStyles.cardSubtitle}>Please sign in to manage your settings.</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const userName = profile?.first_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

  return (
    <ScrollView style={settingsStyles.container}>
      <View style={settingsStyles.content}>
        {/* Header */}
        <View style={settingsStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={settingsStyles.screenTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Section */}
        <View style={settingsStyles.card}>
          <View style={settingsStyles.cardHeader}>
            <Icon name="person" size={20} color="#007AFF" />
            <Text style={settingsStyles.cardTitle}>Profile</Text>
          </View>
          <View style={settingsStyles.cardContent}>
            <View style={settingsStyles.profileSection}>
              <View style={settingsStyles.avatarContainer}>
                <View style={settingsStyles.avatar}>
                  {profile?.avatar_url ? (
                    <Image 
                      source={{ uri: profile.avatar_url }} 
                      style={settingsStyles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={settingsStyles.avatarText}>
                      {profile?.first_name?.[0] || user?.email?.[0] || 'U'}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={settingsStyles.profileInfo}>
                <Text style={settingsStyles.profileName}>{userName}</Text>
                <Text style={settingsStyles.profileEmail}>{userEmail}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[settingsStyles.card, settingsStyles.signOutCard]} onPress={handleSignOut}>
          <Icon name="log-out" size={20} color="#FF3B30" />
          <Text style={settingsStyles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
