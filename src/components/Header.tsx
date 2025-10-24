import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface HeaderProps {
  onMenuPress?: () => void; // For opening drawer/sidebar
  title?: string;
}

export function Header({ onMenuPress, title = 'Aqifi' }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
  };

  const handleSignOut = () => {
    setShowDropdown(false);
    signOut();
  };

  const handleProfilePress = () => {
    setShowDropdown(false);
    // Navigate to profile screen
    // navigation.navigate('Profile');
  };

  const handleSettingsPress = () => {
    setShowDropdown(false);
    // Navigate to settings screen
    // navigation.navigate('Settings');
  };

  return (
    <>
      {/* Status Bar */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="rgba(255, 255, 255, 0.8)" 
        translucent 
      />
      
      {/* Header */}
      <View className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex-row items-center justify-between px-4 lg:px-6">
        {/* Left Side */}
        <View className="flex-row items-center gap-4">
          {/* Menu/Sidebar Trigger */}
          <TouchableOpacity
            onPress={onMenuPress}
            className="p-2 -ml-2 rounded-lg active:bg-gray-100"
            activeOpacity={0.7}
          >
            <Menu size={20} color="#374151" />
          </TouchableOpacity>
          
          {/* Title - Hidden on small screens */}
          <View className="hidden sm:block">
            <Text className="text-lg font-semibold text-gray-900">{title}</Text>
          </View>
        </View>

        {/* Right Side */}
        <View className="flex-row items-center gap-3">
          {/* Notifications */}
          <TouchableOpacity 
            className="relative p-2 rounded-lg active:bg-gray-100"
            activeOpacity={0.7}
          >
            <Bell size={20} color="#374151" />
            {/* Notification Badge */}
            <View className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </TouchableOpacity>

          {/* User Profile Dropdown */}
          <TouchableOpacity
            onPress={() => setShowDropdown(true)}
            className="flex-row items-center gap-2 h-10 px-2 rounded-lg active:bg-gray-100"
            activeOpacity={0.7}
          >
            {/* Avatar */}
            <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center">
              {user?.avatar_url ? (
                <Image 
                  source={{ uri: user.avatar_url }} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <Text className="text-white text-sm font-medium">
                  {user?.email ? getInitials(user.email) : 'U'}
                </Text>
              )}
            </View>
            
            {/* User Name - Hidden on small screens */}
            <View className="hidden sm:block">
              <Text className="text-sm font-medium text-gray-900">
                {getUserDisplayName()}
              </Text>
            </View>
            
            <ChevronDown size={16} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        {/* Backdrop */}
        <TouchableOpacity 
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          {/* Dropdown Content */}
          <View className="absolute top-20 right-4 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* User Info Section */}
            <View className="flex-row items-center gap-2 p-4 border-b border-gray-100">
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center">
                {user?.avatar_url ? (
                  <Image 
                    source={{ uri: user.avatar_url }} 
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <Text className="text-white text-sm font-medium">
                    {user?.email ? getInitials(user.email) : 'U'}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900">
                  {getUserDisplayName()}
                </Text>
                <Text className="text-sm text-gray-500 truncate">
                  {user?.email}
                </Text>
              </View>
            </View>

            {/* Menu Items */}
            <View className="py-2">
              <TouchableOpacity
                onPress={handleProfilePress}
                className="flex-row items-center px-4 py-3 active:bg-gray-50"
                activeOpacity={0.7}
              >
                <User size={16} color="#374151" />
                <Text className="ml-3 text-sm text-gray-900">Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSettingsPress}
                className="flex-row items-center px-4 py-3 active:bg-gray-50"
                activeOpacity={0.7}
              >
                <Text className="ml-6 text-sm text-gray-900">Settings</Text>
              </TouchableOpacity>

              {/* Separator */}
              <View className="h-px bg-gray-100 mx-2 my-2" />

              <TouchableOpacity
                onPress={handleSignOut}
                className="flex-row items-center px-4 py-3 active:bg-gray-50"
                activeOpacity={0.7}
              >
                <LogOut size={16} color="#374151" />
                <Text className="ml-3 text-sm text-gray-900">Log out</Text>
              </TouchableOpacity>
            </View>

            {/* Close button for better UX */}
            <TouchableOpacity
              onPress={() => setShowDropdown(false)}
              className="absolute top-2 right-2 p-1 rounded-full bg-gray-100"
              activeOpacity={0.7}
            >
              <X size={12} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default Header;
