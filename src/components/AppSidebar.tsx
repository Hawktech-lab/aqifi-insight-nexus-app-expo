import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Home,
  Activity,
  FileText,
  Settings,
  Shield,
} from 'lucide-react-native';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface NavigationItem {
  title: string;
  routeName: string;
  icon: React.ComponentType<any>;
}

const navigationItems: NavigationItem[] = [
  { title: 'Home', routeName: 'Home', icon: Home },
  { title: 'Activity', routeName: 'Activity', icon: Activity },
  { title: 'Surveys', routeName: 'Surveys', icon: FileText },
  { title: 'Settings', routeName: 'Settings', icon: Settings },
];

interface AppSidebarProps {
  isCollapsed?: boolean;
  onItemPress?: () => void; // For closing drawer on mobile
}

export function AppSidebar({ isCollapsed = false, onItemPress }: AppSidebarProps) {
  const navigation = useNavigation();
  const route = useRoute();
  const { isAdmin } = useAdminCheck();
  
  const currentRouteName = route.name;

  const isActive = (routeName: string) => {
    return currentRouteName === routeName;
  };

  const handleNavigate = (routeName: string) => {
    navigation.navigate(routeName as never);
    onItemPress?.(); // Close drawer if provided
  };

  const renderNavItem = (item: NavigationItem) => {
    const active = isActive(item.routeName);
    const IconComponent = item.icon;

    return (
      <TouchableOpacity
        key={item.title}
        className={`
          flex-row items-center px-3 py-3 rounded-lg gap-3 transition-colors
          ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}
          ${isCollapsed ? 'justify-center px-2' : ''}
        `}
        onPress={() => handleNavigate(item.routeName)}
        activeOpacity={0.7}
      >
        <IconComponent
          size={20}
          color={active ? '#3b82f6' : '#6b7280'}
          strokeWidth={2}
        />
        {!isCollapsed && (
          <Text className={`text-sm font-medium flex-1 ${
            active ? 'text-blue-600 font-semibold' : 'text-gray-700'
          }`}>
            {item.title}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className={`bg-white border-r border-gray-200 shadow-lg ${
      isCollapsed ? 'w-16' : 'w-60'
    }`}>
      {/* Header */}
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center">
            <Text className="text-white font-bold text-sm">A</Text>
          </View>
          {!isCollapsed && (
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Aqifi</Text>
              <Text className="text-xs text-gray-500">Data Rewards</Text>
            </View>
          )}
        </View>
      </View>

      {/* Navigation */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-2">
          {!isCollapsed && (
            <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 ml-2">
              Navigation
            </Text>
          )}
          <View className="gap-1">
            {navigationItems.map(renderNavItem)}
            
            {/* Admin Item */}
            {isAdmin && (
              <TouchableOpacity
                className={`
                  flex-row items-center px-3 py-3 rounded-lg gap-3 transition-colors
                  ${isActive('Admin') ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  ${isCollapsed ? 'justify-center px-2' : ''}
                `}
                onPress={() => handleNavigate('Admin')}
                activeOpacity={0.7}
              >
                <Shield
                  size={20}
                  color={isActive('Admin') ? '#3b82f6' : '#6b7280'}
                  strokeWidth={2}
                />
                {!isCollapsed && (
                  <Text className={`text-sm font-medium flex-1 ${
                    isActive('Admin') ? 'text-blue-600 font-semibold' : 'text-gray-700'
                  }`}>
                    Admin
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default AppSidebar;
