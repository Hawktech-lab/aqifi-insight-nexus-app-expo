import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  progress?: number;
  className?: string;
  onPress?: () => void; // Optional press handler for mobile
}

// Custom Progress Bar Component
const ProgressBar = ({ value, className = '' }: { value: number; className?: string }) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <View className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <View 
        className="h-full bg-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </View>
  );
};

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  progress,
  className = "",
  onPress
}: KPICardProps) {
  const CardWrapper = onPress ? TouchableOpacity : View;
  
  return (
    <CardWrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={`
        bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl 
        shadow-sm p-4 m-2 
        ${onPress ? 'active:scale-95 active:shadow-md' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-medium text-gray-600">
          {title}
        </Text>
        <Icon size={16} color="#6b7280" strokeWidth={2} />
      </View>

      {/* Content */}
      <View>
        {/* Main Value */}
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          {value}
        </Text>
        
        {/* Subtitle */}
        {subtitle && (
          <Text className="text-xs text-gray-500 mb-1">
            {subtitle}
          </Text>
        )}
        
        {/* Trend */}
        {trend && (
          <Text className={`text-xs mb-2 ${
            trend.isPositive ? "text-green-600" : "text-red-500"
          }`}>
            {trend.isPositive ? "+" : ""}{trend.value}
          </Text>
        )}
        
        {/* Progress */}
        {progress !== undefined && (
          <View className="mt-3">
            <ProgressBar value={progress} className="mb-2" />
            <Text className="text-xs text-gray-500">
              {progress}% complete
            </Text>
          </View>
        )}
      </View>
    </CardWrapper>
  );
}

// Alternative version with more pronounced glass effect
export function GlassKPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  progress,
  className = "",
  onPress
}: KPICardProps) {
  const CardWrapper = onPress ? TouchableOpacity : View;
  
  return (
    <CardWrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={`
        bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl 
        shadow-lg shadow-black/5 p-5 m-2
        ${onPress ? 'active:scale-95 active:shadow-xl' : ''}
        ${className}
      `}
    >
      {/* Header with Gradient Background */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-sm font-semibold text-gray-700">
          {title}
        </Text>
        <View className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg items-center justify-center">
          <Icon size={16} color="#ffffff" strokeWidth={2} />
        </View>
      </View>

      {/* Content */}
      <View>
        {/* Main Value with Gradient Text Effect */}
        <View className="mb-2">
          <Text className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {value}
          </Text>
        </View>
        
        {/* Subtitle */}
        {subtitle && (
          <Text className="text-sm text-gray-600 mb-2">
            {subtitle}
          </Text>
        )}
        
        {/* Trend with Background */}
        {trend && (
          <View className={`self-start px-2 py-1 rounded-full mb-3 ${
            trend.isPositive ? "bg-green-100" : "bg-red-100"
          }`}>
            <Text className={`text-xs font-medium ${
              trend.isPositive ? "text-green-700" : "text-red-700"
            }`}>
              {trend.isPositive ? "↗ +" : "↘ "}{trend.value}
            </Text>
          </View>
        )}
        
        {/* Enhanced Progress */}
        {progress !== undefined && (
          <View className="mt-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-medium text-gray-600">Progress</Text>
              <Text className="text-xs font-bold text-blue-600">{progress}%</Text>
            </View>
            <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <View 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </View>
          </View>
        )}
      </View>
    </CardWrapper>
  );
}

export default KPICard;
