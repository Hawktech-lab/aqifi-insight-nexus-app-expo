import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'; // Import core React Native components
// For icons, you'll typically use a library like 'react-native-vector-icons'.
// Make sure to install and link it: npm install react-native-vector-icons
// For Lucide, there might be a community port or you'll need to use SVG support.
// For simplicity, I'll use placeholders or suggest react-native-vector-icons equivalents.
// If you specifically need Lucide, you might look into 'lucide-react-native' or 'react-native-svg' for custom icons.

// Placeholder for Lucide icons for demonstration.
// In a real app, you'd replace these with actual React Native icon components.
import { Heart, Smartphone, Wifi, MapPin, Mail, Zap, Navigation, RefreshCw } from "lucide-react-native"; // Assuming a lucide-react-native exists or similar
import { Activity as ActivityIcon } from "lucide-react-native";


// For Card, Progress, Button, Badge - you'll need to create these as custom Nativewind components
// or use simple Views/Texts with Nativewind classes.
// Here, I'll use basic View/Text components and apply styles directly.
import { useDataStreams } from '@/hooks/useDataStreams';
import { styled } from 'nativewind'; // For applying Tailwind classes

// Styled components using Nativewind
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

// Define your custom components for Card, Button, Badge, etc.
// These are simplified examples; you'd build more robust components in a real app.

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = styled(({ children, className }: CardProps) => (
  <StyledView className={`rounded-lg bg-white shadow-md ${className}`}>
    {children}
  </StyledView>
));

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}
const CardHeader = styled(({ children, className }: CardHeaderProps) => (
  <StyledView className={`p-4 pb-0 ${className}`}>
    {children}
  </StyledView>
));

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}
const CardTitle = styled(({ children, className }: CardTitleProps) => (
  <StyledText className={`text-lg font-semibold ${className}`}>
    {children}
  </StyledText>
));

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
const CardContent = styled(({ children, className }: CardContentProps) => (
  <StyledView className={`p-4 pt-3 ${className}`}>
    {children}
  </StyledView>
));

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'outline' | 'default'; // Only 'outline' is used in original, adding 'default' for completeness
  className?: string;
}
const Button = styled(({ children, onClick, disabled, variant = 'default', className }: ButtonProps) => (
  <StyledTouchableOpacity
    onPress={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg flex-row items-center justify-center 
      ${variant === 'outline' ? 'border border-gray-300 bg-white' : 'bg-blue-500'}
      ${disabled ? 'opacity-50' : ''}
      ${className}
    `}
  >
    {children}
  </StyledTouchableOpacity>
));

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary';
  className?: string;
}
const Badge = styled(({ children, variant = 'default', className }: BadgeProps) => (
  <StyledView
    className={`px-3 py-1 rounded-full text-xs font-semibold 
      ${variant === 'default' ? 'bg-blue-500' : 'bg-gray-20'} 
      ${className}
    `}
  >
    <StyledText className={`${variant === 'default' ? 'text-white' : 'text-gray-700'}`}>
      {children}
    </StyledText>
  </StyledView>
));

// Note: Progress component is more complex in RN. For simplicity,
// I'm omitting a full Progress component implementation here.
// You might use react-native-progress or build your own.

const streamIcons = {
  steps: Heart,
  device_metadata: Smartphone,
  email_metadata: Mail,
  wifi: Wifi,
  spatial: Navigation,
  location: MapPin,
  behavioral: Zap,
};

const streamNames = {
  steps: "Steps & Activity",
  device_metadata: "Device Metadata", 
  email_metadata: "Gmail Data",
  wifi: "WiFi Sharing",
  spatial: "Spatial Data",
  location: "Location Data",
  behavioral: "Behavioral Data",
};

export default function Activity() {
  // Assuming useDataStreams now returns a refetch function
  const { dataStreams, loading, refetch } = useDataStreams(); //
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    // In React Native, instead of window.location.reload(), you re-fetch data.
    // Assuming useDataStreams provides a refetch function.
    if (refetch) {
      await refetch();
    } else {
      console.warn("refetch function not available in useDataStreams hook.");
      // If refetch is not available, you might alert the user or implement a different logic
      // e.g., trigger a state change that causes data to be re-fetched.
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
        <StyledText className="text-xl font-bold mt-4">
          Loading...
        </StyledText>
      </StyledView>
    );
  }

  const activeStreams = dataStreams.filter(stream => stream.is_enabled);
  const totalEarnings = dataStreams.reduce((sum, stream) => 
    sum + (stream.earnings_rate || 0) * (stream.data_count || 0), 0
  );
  const pendingStreams = dataStreams.filter(stream => !stream.is_enabled);

  return (
    <StyledView className="flex-1 p-6 bg-gray-100 space-y-6">
      <StyledView className="flex-row items-center justify-between">
        <StyledView>
          <StyledText className="text-2xl font-bold text-gray-900 mb-2">
            Activity & Data Streams
          </StyledText>
          <StyledText className="text-sm text-gray-500">
            Real-time view of your connected data sources and earnings
          </StyledText>
        </StyledView>
        <Button 
          variant="outline" 
          onClick={refreshData}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <StyledText className="text-gray-700">Refresh Data</StyledText>
        </Button>
      </StyledView>

      {/* Stats Overview */}
      <StyledView className="flex-col md:flex-row gap-4"> {/* Use flex-col and responsive classes if needed */}
        <Card className="flex-1 bg-white p-6 rounded-lg shadow-md"> {/* Replace glass-card conceptually */}
          <StyledView className="flex-row items-center gap-4">
            <StyledView className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <ActivityIcon className="w-6 h-6 text-white" />
            </StyledView>
            <StyledView>
              <StyledText className="text-2xl font-bold text-blue-600">{activeStreams.length}</StyledText> {/* Replace gradient-text conceptually */}
              <StyledText className="text-sm text-gray-500">Active Streams</StyledText>
            </StyledView>
          </StyledView>
        </Card>

        <Card className="flex-1 bg-white p-6 rounded-lg shadow-md">
          <StyledView className="flex-row items-center gap-4">
            <StyledView className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </StyledView>
            <StyledView>
              <StyledText className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</StyledText>
              <StyledText className="text-sm text-gray-500">Potential Earnings</StyledText>
            </StyledView>
          </StyledView>
        </Card>

        <Card className="flex-1 bg-white p-6 rounded-lg shadow-md">
          <StyledView className="flex-row items-center gap-4">
            <StyledView className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" />
            </StyledView>
            <StyledView>
              <StyledText className="text-2xl font-bold text-red-600">{pendingStreams.length}</StyledText>
              <StyledText className="text-sm text-gray-500">Pending Setup</StyledText>
            </StyledView>
          </StyledView>
        </Card>
      </StyledView>

      {/* Data Streams */}
      <StyledView className="space-y-4">
        <StyledText className="text-xl font-semibold">Data Streams</StyledText>
        <StyledView className="gap-4">
          {dataStreams.map((stream) => {
            const IconComponent = streamIcons[stream.stream_type as keyof typeof streamIcons] || ActivityIcon;
            const streamName = streamNames[stream.stream_type as keyof typeof streamNames] || stream.stream_type;
            const potentialEarnings = (stream.earnings_rate || 0) * (stream.data_count || 0);
            
            return (
              <Card key={stream.id} className="bg-white p-4 rounded-lg shadow-sm">
                <CardHeader className="pb-3">
                  <StyledView className="flex-row items-center justify-between">
                    <StyledView className="flex-row items-center gap-3">
                      <IconComponent className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg">{streamName}</CardTitle>
                    </StyledView>
                    <Badge 
                      variant={stream.is_enabled ? "default" : "secondary"}
                      className={stream.is_enabled ? "bg-green-500" : "bg-gray-200"} // Use actual Tailwind colors
                    >
                      {stream.is_enabled ? "active" : "disabled"}
                    </Badge>
                  </StyledView>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-sm text-gray-500">Earnings Rate</StyledText>
                    <StyledText className="font-semibold text-green-600">${(stream.earnings_rate || 0).toFixed(3)}/point</StyledText>
                  </StyledView>
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-sm text-gray-500">Data Points</StyledText>
                    <StyledText className="text-sm">{stream.data_count || 0} collected</StyledText>
                  </StyledView>
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-sm text-gray-500">Potential Earnings</StyledText>
                    <StyledText className="text-sm font-medium">${potentialEarnings.toFixed(2)}</StyledText>
                  </StyledView>
                  <StyledView className="space-y-2">
                    <StyledView className="flex-row justify-between items-center">
                      <StyledText className="text-sm text-gray-500">Last Sync</StyledText>
                      <StyledText className="text-sm">
                        {stream.last_sync_at 
                          ? new Date(stream.last_sync_at).toLocaleDateString()
                          : 'Never'
                        }
                      </StyledText>
                    </StyledView>
                  </StyledView>
                  {!stream.is_enabled && (
                    <StyledText className="text-sm text-gray-500 mt-2">
                      Enable this stream in Settings to start earning from your {streamName.toLowerCase()}
                    </StyledText>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </StyledView>
      </StyledView>
    </StyledView>
  );
}
